# ELA Versioned Replanning Engine (Phase 12.3)
from typing import Dict, Any, Optional
from datetime import datetime, timezone

from ai.ela.planner.models import ElaPlan, ElaPlanStep
from ai.ela.planner.evaluator import PlanEvaluator


class ReplanningEngine:
    """
    Authoritative replanning subsystem.
    When execution fails, operational conditions change, or strategies shift,
    the active plan is invalidated, preserved in audit history, and an explicit
    new Plan version is generated with parent lineage.
    """
    _audit_history: Dict[str, List[ElaPlan]] = {}  # plan_id -> [v1, v2, ...]

    @classmethod
    def reset_for_testing(cls):
        cls._audit_history.clear()

    @classmethod
    def replan(
        cls,
        old_plan: ElaPlan,
        observation_trigger: str,
        reason: str,
        updated_strategy: Optional[str] = None,
        updated_entities: Optional[Dict[str, Any]] = None,
        operational_delta: Optional[Dict[str, Any]] = None,
    ) -> ElaPlan:
        """
        Creates a new version of the plan while preserving the old version.
        Guarantees non-destructive plan versioning.
        """
        # 1. Invalidate and preserve Old Plan
        old_plan.status = "INVALIDATED"
        old_plan.replan_reason = reason
        old_plan.observation_trigger = observation_trigger
        old_plan.updated_at = datetime.now(timezone.utc).isoformat()
        cls._audit_history.setdefault(old_plan.plan_id, []).append(old_plan)

        # 2. Derive new strategy and constraints
        new_strat = updated_strategy or old_plan.strategy
        new_version = old_plan.version + 1

        # 3. Adapt steps to the new operational condition
        new_steps = []
        for step in old_plan.steps:
            # Clone step with updated version IDs
            cloned_step = ElaPlanStep(
                step_id=f"{old_plan.plan_id}-v{new_version}-{step.order}",
                order=step.order,
                name=step.name,
                objective=step.objective,
                owner_agent=step.owner_agent,
                required_tools=list(step.required_tools),
                inputs=dict(step.inputs),
                expected_outputs=dict(step.expected_outputs),
                dependencies=[f"{old_plan.plan_id}-v{new_version}-{dep.split('-')[-1]}" for dep in step.dependencies],
                risk_level=step.risk_level,
                authorization_required=step.authorization_required,
                evidence_required=step.evidence_required,
                verification_required=step.verification_required,
                status="PENDING",
                idempotency_key=f"idemp-{old_plan.plan_id}-v{new_version}-{step.order}",
            )

            # If replanning because carrier was unavailable, inject alternate vehicle constraint
            if "unavailable" in observation_trigger.lower() and cloned_step.owner_agent == "LogisticsAgent":
                cloned_step.inputs["exclude_vehicle"] = "Mini Truck (750 kg)"
                cloned_step.inputs["fallback_vehicle"] = "Pickup Truck (1.5 ton)"
                cloned_step.objective += " (Excluding unavailable carrier; evaluating alternate fleet)"

            # If strategy shifted (e.g. CHEAPEST -> HIGHEST_RELIABILITY)
            if new_strat != old_plan.strategy:
                cloned_step.inputs["strategy"] = new_strat
                if cloned_step.owner_agent == "RiskAgent":
                    cloned_step.risk_level = "LOW"
                    cloned_step.objective = f"Strict reliability gate for {new_strat}"

            new_steps.append(cloned_step)

        # 4. Construct Plan vN
        new_plan = ElaPlan(
            plan_id=old_plan.plan_id,
            version=new_version,
            parent_version=old_plan.version,
            goal_id=old_plan.goal_id,
            session_id=old_plan.session_id,
            user_id=old_plan.user_id,
            status="READY",
            objective=old_plan.objective,
            strategy=new_strat,
            context_snapshot_id=old_plan.context_snapshot_id,
            transformer_model_version=old_plan.transformer_model_version,
            planner_version=old_plan.planner_version,
            steps=new_steps,
            constraints=dict(old_plan.constraints, strategy=new_strat),
            risks=list(old_plan.risks),
            authorization_requirements=list(old_plan.authorization_requirements),
            expected_outcome=dict(old_plan.expected_outcome, strategy=new_strat),
            replan_reason=reason,
            observation_trigger=observation_trigger,
        )

        # 5. Pre-execution evaluation of the new plan version
        eval_report = PlanEvaluator.evaluate(new_plan)
        if not eval_report.valid:
            new_plan.status = "FAILED"
            new_plan.replan_reason = f"Replanning failed evaluation: {eval_report.blocking_issues}"

        cls._audit_history.setdefault(new_plan.plan_id, []).append(new_plan)
        return new_plan

    @classmethod
    def get_audit_trail(cls, plan_id: str) -> List[ElaPlan]:
        return cls._audit_history.get(plan_id, [])
