# Phase 12.3 Agentic Planning Engine Verification Suite
import pytest
import asyncio
from datetime import datetime, timezone

from ai.ela.planner.models import (
    ElaPlan,
    ElaPlanStep,
    DependencyGraph,
    ElaPlanEvaluation,
    ElaPlanObservation,
)
from ai.ela.planner.capabilities import AgentCapabilityRegistry
from ai.ela.planner.evaluator import PlanEvaluator
from ai.ela.planner.engine import AgenticPlanner
from ai.ela.planner.executor import PlanExecutor
from ai.ela.planner.observation import ObservationEngine
from ai.ela.planner.replan import ReplanningEngine
from ai.ela.memory.context import ElaCognitiveContext
from ai.ela.memory.goal import ElaGoal
from ai.ela.memory.records import ElaMemoryRecord
from ai.ela.memory.store import CognitiveMemoryStore
from ai.ela.agents.coordinator import AgentCoordinator
from ai.ela.agent.brain import ElaUniversalBrain
from ai.ela.agent.loop import AgentChatRequest


# =============================================================================
# PART A: Plan & Step Model Tests
# =============================================================================
def test_plan_and_step_model_creation():
    step1 = ElaPlanStep(
        step_id="step-1",
        order=1,
        name="Predict ETA",
        objective="Calculate transit time",
        owner_agent="PredictionAgent",
        required_tools=["predict_eta_cost"],
        dependencies=[],
    )
    step2 = ElaPlanStep(
        step_id="step-2",
        order=2,
        name="Rank Vehicles",
        objective="Rank transport",
        owner_agent="LogisticsAgent",
        required_tools=["rank_transport_options"],
        dependencies=["step-1"],
    )
    plan = ElaPlan(
        plan_id="plan-101",
        version=1,
        goal_id="goal-101",
        session_id="sess-101",
        objective="Send tomatoes to Pune",
        steps=[step1, step2],
    )
    assert plan.plan_id == "plan-101"
    assert len(plan.steps) == 2
    assert plan.status == "DRAFT"
    assert plan.version == 1
    assert plan.parent_version is None


def test_step_status_transitions():
    step = ElaPlanStep(
        step_id="s1",
        name="Step 1",
        objective="Test step",
        owner_agent="FarmerAgent",
        status="PENDING",
    )
    step.mark_running()
    assert step.status == "RUNNING"

    step.mark_succeeded({"result": "ok"})
    assert step.status == "SUCCEEDED"
    assert step.actual_result == {"result": "ok"}

    step.mark_failed("Network timeout")
    assert step.status == "FAILED"
    assert step.error_message == "Network timeout"


# =============================================================================
# PART B: Dependency Graph & Cycle Detection Tests
# =============================================================================
def test_valid_dag_topological_sort():
    s1 = ElaPlanStep(step_id="s1", name="S1", objective="o1", owner_agent="A", dependencies=[])
    s2 = ElaPlanStep(step_id="s2", name="S2", objective="o2", owner_agent="B", dependencies=["s1"])
    s3 = ElaPlanStep(step_id="s3", name="S3", objective="o3", owner_agent="C", dependencies=["s2"])

    assert not DependencyGraph.detect_cycles([s1, s2, s3])
    ordered = DependencyGraph.topological_sort([s3, s1, s2])
    assert [s.step_id for s in ordered] == ["s1", "s2", "s3"]


def test_circular_dependency_detected_and_rejected():
    s1 = ElaPlanStep(step_id="s1", name="S1", objective="o1", owner_agent="A", dependencies=["s3"])
    s2 = ElaPlanStep(step_id="s2", name="S2", objective="o2", owner_agent="B", dependencies=["s1"])
    s3 = ElaPlanStep(step_id="s3", name="S3", objective="o3", owner_agent="C", dependencies=["s2"])

    assert DependencyGraph.detect_cycles([s1, s2, s3]) is True
    with pytest.raises(ValueError, match="circular dependencies"):
        DependencyGraph.topological_sort([s1, s2, s3])


def test_get_ready_steps_blocks_until_prerequisites_succeed():
    s1 = ElaPlanStep(step_id="s1", name="S1", objective="o1", owner_agent="A", status="PENDING", dependencies=[])
    s2 = ElaPlanStep(step_id="s2", name="S2", objective="o2", owner_agent="B", status="PENDING", dependencies=["s1"])

    ready = DependencyGraph.get_ready_steps([s1, s2])
    assert len(ready) == 1
    assert ready[0].step_id == "s1"

    # s1 succeeds
    s1.status = "SUCCEEDED"
    ready2 = DependencyGraph.get_ready_steps([s1, s2])
    assert len(ready2) == 1
    assert ready2[0].step_id == "s2"


# =============================================================================
# PART C: Capability & Agent Selection Tests
# =============================================================================
def test_agent_capability_lookup():
    assert AgentCapabilityRegistry.has_agent("FarmerAgent") is True
    assert AgentCapabilityRegistry.has_agent("PredictionAgent") is True
    assert AgentCapabilityRegistry.has_agent("HallucinatedAgent") is False

    valid, err = AgentCapabilityRegistry.validate_step_capability("FarmerAgent", ["create_product"])
    assert valid is True
    assert err is None

    invalid, err2 = AgentCapabilityRegistry.validate_step_capability("FakeAgent", ["create_product"])
    assert invalid is False
    assert "Unknown agent" in err2


# =============================================================================
# PART D & E: Plan Evaluator & Security Authorization Gates
# =============================================================================
def test_plan_evaluator_rejects_missing_authorization_gate():
    s1 = ElaPlanStep(
        step_id="s1",
        name="Direct Database Mutation",
        objective="Create booking without auth",
        owner_agent="LogisticsAgent",
        required_tools=["create_logistics_request"],
        authorization_required=False,  # Security violation!
        dependencies=[],
    )
    plan = ElaPlan(
        plan_id="p-insecure",
        goal_id="g1",
        session_id="s1",
        objective="Insecure plan",
        steps=[s1],
    )
    evaluation = PlanEvaluator.evaluate(plan)
    assert evaluation.valid is False
    assert any("Security violation" in issue for issue in evaluation.blocking_issues)


def test_plan_evaluator_accepts_valid_plan():
    s1 = ElaPlanStep(
        step_id="s1",
        name="Predict Tariffs",
        objective="Compute pricing",
        owner_agent="PredictionAgent",
        required_tools=["predict_eta_cost"],
        authorization_required=False,
        dependencies=[],
    )
    s2 = ElaPlanStep(
        step_id="s2",
        name="Stage Booking",
        objective="Stage booking card",
        owner_agent="LogisticsAgent",
        required_tools=["create_logistics_request"],
        authorization_required=True,
        verification_required=True,
        dependencies=["s1"],
    )
    plan = ElaPlan(
        plan_id="p-valid",
        goal_id="g1",
        session_id="s1",
        objective="Valid transport plan",
        steps=[s1, s2],
    )
    evaluation = PlanEvaluator.evaluate(plan)
    assert evaluation.valid is True
    assert len(evaluation.blocking_issues) == 0


# =============================================================================
# PART F, G & H: Execution, Observations & Authoritative Verification
# =============================================================================
@pytest.mark.asyncio
async def test_plan_executor_halts_at_authorization_gate():
    s1 = ElaPlanStep(
        step_id="s1",
        name="Predict",
        objective="Predict tariffs",
        owner_agent="PredictionAgent",
        required_tools=["predict_eta_cost"],
        dependencies=[],
    )
    s2 = ElaPlanStep(
        step_id="s2",
        name="Commit Booking",
        objective="Book carrier",
        owner_agent="LogisticsAgent",
        required_tools=["create_logistics_request"],
        authorization_required=True,
        dependencies=["s1"],
    )
    plan = ElaPlan(
        plan_id="p-gate",
        goal_id="g1",
        session_id="s1",
        objective="Transport Tomatoes",
        steps=[s1, s2],
    )
    coordinator = AgentCoordinator()
    executor = PlanExecutor()

    # Run without user authorization
    executed_plan, obs = await executor.execute(plan, coordinator, user_authorized=False)
    assert executed_plan.status == "AWAITING_AUTHORIZATION"
    assert s1.status == "SUCCEEDED"
    assert s2.status == "WAITING"
    assert len(obs) == 1  # only s1 completed


def test_authoritative_verification_requires_java_entity_id():
    s_consequential = ElaPlanStep(
        step_id="s-auth",
        name="Commit Booking",
        objective="Book transport",
        owner_agent="LogisticsAgent",
        required_tools=["create_logistics_request"],
        verification_required=True,
    )
    # 1. Agent returned success message without database booking ID
    v1, err1 = ObservationEngine.verify_step_outcome(s_consequential, {"message": "Success! Booked."})
    assert v1 is False
    assert "Missing authoritative entity ID" in err1

    # 2. Agent returned authoritative booking ID from Java Authority
    v2, err2 = ObservationEngine.verify_step_outcome(s_consequential, {"booking_id": "req-998877", "status": "CONFIRMED"})
    assert v2 is True
    assert err2 is None


# =============================================================================
# PART I: Versioned Replanning Tests
# =============================================================================
def test_replanning_engine_creates_version_lineage():
    s1 = ElaPlanStep(step_id="p1-1", order=1, name="Rank", objective="Rank vehicles", owner_agent="LogisticsAgent")
    p_v1 = ElaPlan(
        plan_id="plan-repl-01",
        version=1,
        goal_id="g1",
        session_id="s1",
        objective="Transport tomatoes",
        strategy="CHEAPEST",
        steps=[s1],
    )
    # Carrier became unavailable -> Replan triggered
    p_v2 = ReplanningEngine.replan(
        old_plan=p_v1,
        observation_trigger="CARRIER_UNAVAILABLE",
        reason="Assigned Mini Truck reported breakdown before dispatch",
        updated_strategy="HIGHEST_RELIABILITY",
    )

    assert p_v1.status == "INVALIDATED"
    assert p_v2.plan_id == "plan-repl-01"
    assert p_v2.version == 2
    assert p_v2.parent_version == 1
    assert p_v2.strategy == "HIGHEST_RELIABILITY"
    assert p_v2.replan_reason == "Assigned Mini Truck reported breakdown before dispatch"
    assert p_v2.observation_trigger == "CARRIER_UNAVAILABLE"


# =============================================================================
# PART J & K: Idempotency & Cognitive Context Integration
# =============================================================================
def test_deterministic_idempotency_keys():
    cognitive_ctx = ElaCognitiveContext(
        session_id="sess-idemp",
        role="FARMER",
        language="en",
        current_request_message="Send tomatoes to Pune",
        strategy="CHEAPEST",
    )
    plan = AgenticPlanner.create_plan(
        cognitive_ctx=cognitive_ctx,
        transformer_state={"decision_score": 0.88, "model_version": "v1.0-transformer-core"},
        goal_id="g-101",
        objective="Transport tomatoes to Pune",
        role="FARMER",
        strategy="CHEAPEST",
        entities={"product": "Tomatoes", "quantity": 500, "destination": "Pune"},
    )
    step5 = plan.get_step(f"{plan.plan_id}-step-5")
    assert step5 is not None
    assert step5.idempotency_key == f"idemp-{plan.plan_id}-{step5.step_id}"


# =============================================================================
# PART L & M: Universal Brain E2E Integration with Planning Observability
# =============================================================================
@pytest.mark.asyncio
async def test_brain_generates_structured_plan_in_trace():
    brain = ElaUniversalBrain()
    req = AgentChatRequest(
        message="I need to transport 500 kg tomatoes from Nashik to Pune with the cheapest option.",
        authenticated=True,
        authenticated_role="FARMER",
        user_id="farmer-101",
        language="en",
        session_id="sess-brain-plan-01",
    )
    resp = await brain.process_chat(req)

    assert resp.status == "CONFIRMATION_REQUIRED"
    assert resp.trace.planning is not None
    p_trace = resp.trace.planning

    assert p_trace["plan_id"] is not None
    assert p_trace["plan_version"] == 1
    assert p_trace["planner_version"] == "ela-agentic-planner-v12.3"
    assert p_trace["status"] == "AWAITING_AUTHORIZATION"
    assert p_trace["steps_count"] >= 4
    assert p_trace["authorization_required"] is True
    assert p_trace["plan_evaluation"]["valid"] is True
    assert "LogisticsAgent" in p_trace["selected_agents"]
