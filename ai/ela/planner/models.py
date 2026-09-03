# ELA Agentic Plan and Step Models (Phase 12.3)
from typing import Dict, Any, List, Optional, Literal, Set
from pydantic import BaseModel, Field
from datetime import datetime, timezone
import uuid

PlanStatus = Literal[
    'DRAFT',
    'READY',
    'AWAITING_AUTHORIZATION',
    'EXECUTING',
    'PAUSED',
    'REPLANNING',
    'COMPLETED',
    'FAILED',
    'CANCELLED',
    'INVALIDATED',
    'EXPIRED',
]

StepStatus = Literal[
    'PENDING',
    'BLOCKED',
    'READY',
    'RUNNING',
    'WAITING',
    'SUCCEEDED',
    'FAILED',
    'SKIPPED',
    'CANCELLED',
    'INVALIDATED',
]

RiskLevel = Literal['LOW', 'MODERATE', 'HIGH', 'CRITICAL']


class ElaPlanStep(BaseModel):
    """
    Explicit, strongly typed plan step for agentic delegation.
    Defines owning agent, required tools, explicit DAG dependencies,
    authorization gates, and verification criteria.
    """
    step_id: str = Field(default_factory=lambda: f"step-{uuid.uuid4().hex[:8]}")
    order: int = 1
    name: str
    objective: str
    owner_agent: str
    required_tools: List[str] = Field(default_factory=list)
    inputs: Dict[str, Any] = Field(default_factory=dict)
    expected_outputs: Dict[str, Any] = Field(default_factory=dict)
    dependencies: List[str] = Field(default_factory=list)  # step_ids that must SUCCEED first
    prerequisites: List[str] = Field(default_factory=list)
    constraints: Dict[str, Any] = Field(default_factory=dict)
    risk_level: RiskLevel = 'LOW'
    authorization_required: bool = False
    evidence_required: bool = False
    verification_required: bool = False
    fallback_strategy: Optional[str] = None
    retry_policy: Dict[str, Any] = Field(default_factory=lambda: {"max_retries": 2, "delay_ms": 100})
    replanning_conditions: List[str] = Field(default_factory=list)
    status: StepStatus = 'PENDING'
    actual_result: Optional[Dict[str, Any]] = None
    idempotency_key: Optional[str] = None
    error_message: Optional[str] = None

    def mark_running(self):
        self.status = 'RUNNING'

    def mark_succeeded(self, result: Dict[str, Any]):
        self.status = 'SUCCEEDED'
        self.actual_result = result

    def mark_failed(self, error: str):
        self.status = 'FAILED'
        self.error_message = error

    def mark_waiting_authorization(self):
        self.status = 'WAITING'

    def mark_blocked(self, reason: str):
        self.status = 'BLOCKED'
        self.error_message = reason


class ElaPlanObservation(BaseModel):
    """Structured observation captured after executing a plan step."""
    observation_id: str = Field(default_factory=lambda: f"obs-{uuid.uuid4().hex[:8]}")
    plan_id: str
    step_id: str
    expected_result: Dict[str, Any] = Field(default_factory=dict)
    actual_result: Dict[str, Any] = Field(default_factory=dict)
    outcome_status: str = "SUCCESS"
    evidence: Dict[str, Any] = Field(default_factory=dict)
    world_state_delta: Dict[str, Any] = Field(default_factory=dict)
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    provenance: str = "SYSTEM_OBSERVED"


class ElaPlanEvaluation(BaseModel):
    """Pre-execution evaluation report produced by PlanEvaluator."""
    plan_id: str
    valid: bool
    blocking_issues: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)
    unmet_constraints: List[str] = Field(default_factory=list)
    missing_capabilities: List[str] = Field(default_factory=list)
    authorization_gaps: List[str] = Field(default_factory=list)
    verification_gaps: List[str] = Field(default_factory=list)
    risk_summary: str = "LOW_RISK"


class ElaPlan(BaseModel):
    """
    Versioned, strongly typed agentic execution plan.
    Maintains machine-executable step DAG, parent version lineage, and audit trail.
    """
    plan_id: str = Field(default_factory=lambda: f"plan-{uuid.uuid4().hex[:8]}")
    version: int = 1
    parent_version: Optional[int] = None
    goal_id: str
    session_id: str
    user_id: Optional[str] = None
    status: PlanStatus = 'DRAFT'
    objective: str
    strategy: str = 'BALANCED'
    context_snapshot_id: Optional[str] = None
    transformer_model_version: str = 'v1.0-transformer-core'
    planner_version: str = 'ela-agentic-planner-v12.3'
    steps: List[ElaPlanStep] = Field(default_factory=list)
    constraints: Dict[str, Any] = Field(default_factory=dict)
    assumptions: List[str] = Field(default_factory=list)
    risks: List[Dict[str, Any]] = Field(default_factory=list)
    authorization_requirements: List[str] = Field(default_factory=list)
    expected_outcome: Dict[str, Any] = Field(default_factory=dict)
    replan_reason: Optional[str] = None
    observation_trigger: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    def get_step(self, step_id: str) -> Optional[ElaPlanStep]:
        for s in self.steps:
            if s.step_id == step_id:
                return s
        return None

    def is_complete(self) -> bool:
        return all(s.status == 'SUCCEEDED' for s in self.steps)

    def has_failures(self) -> bool:
        return any(s.status == 'FAILED' for s in self.steps)


class DependencyGraph:
    """Validates DAG constraints and manages topological step execution."""

    @classmethod
    def detect_cycles(cls, steps: List[ElaPlanStep]) -> bool:
        """
        Detects circular dependencies in the plan step graph.
        Returns True if a cycle exists (invalid plan), False if acyclic (valid DAG).
        """
        adj: Dict[str, List[str]] = {s.step_id: list(s.dependencies) for s in steps}
        visited: Set[str] = set()
        rec_stack: Set[str] = set()

        def dfs(node: str) -> bool:
            visited.add(node)
            rec_stack.add(node)
            for neighbor in adj.get(node, []):
                if neighbor not in visited:
                    if dfs(neighbor):
                        return True
                elif neighbor in rec_stack:
                    return True
            rec_stack.remove(node)
            return False

        for step in steps:
            if step.step_id not in visited:
                if dfs(step.step_id):
                    return True
        return False

    @classmethod
    def get_ready_steps(cls, steps: List[ElaPlanStep]) -> List[ElaPlanStep]:
        """
        Returns all steps whose dependencies have status == 'SUCCEEDED'
        and whose current status is 'PENDING' or 'READY'.
        """
        succeeded_ids = {s.step_id for s in steps if s.status == 'SUCCEEDED'}
        ready = []
        for s in steps:
            if s.status in ['PENDING', 'READY', 'WAITING']:
                if all(dep in succeeded_ids for dep in s.dependencies):
                    ready.append(s)
        return ready

    @classmethod
    def topological_sort(cls, steps: List[ElaPlanStep]) -> List[ElaPlanStep]:
        """Returns steps sorted in dependency order."""
        if cls.detect_cycles(steps):
            raise ValueError("Plan contains circular dependencies and cannot be topologically sorted.")

        step_map = {s.step_id: s for s in steps}
        in_degree = {s.step_id: len(s.dependencies) for s in steps}
        queue = [s.step_id for s in steps if in_degree[s.step_id] == 0]
        sorted_steps = []

        # Map dependent steps
        dependents: Dict[str, List[str]] = {s.step_id: [] for s in steps}
        for s in steps:
            for dep in s.dependencies:
                if dep in dependents:
                    dependents[dep].append(s.step_id)

        while queue:
            curr_id = queue.pop(0)
            sorted_steps.append(step_map[curr_id])
            for dep_id in dependents.get(curr_id, []):
                in_degree[dep_id] -= 1
                if in_degree[dep_id] == 0:
                    queue.append(dep_id)

        if len(sorted_steps) != len(steps):
            raise ValueError("Unresolved dependencies found in plan steps.")
        return sorted_steps
