# ELA Persistent Goal State Machine (Phase 12.2)
from typing import Dict, Any, Optional, List, Literal
from pydantic import BaseModel, Field
from datetime import datetime, timezone
import uuid

from ai.ela.agent.state import UserRole, CanonicalEntities

GoalStatus = Literal[
    "ACTIVE",
    "WAITING_FOR_USER",
    "WAITING_FOR_AUTHORIZATION",
    "EXECUTING",
    "BLOCKED",
    "COMPLETED",
    "FAILED",
    "CANCELLED",
    "EXPIRED",
]


class ElaGoal(BaseModel):
    """
    Persistent, multi-turn cognitive goal state.
    Distinguishes active transactional objectives from conversational intents.
    """
    goal_id: str = Field(default_factory=lambda: f"goal-{uuid.uuid4().hex[:8]}")
    session_id: str
    user_id: Optional[str] = None
    role: UserRole = "FARMER"
    objective: str
    status: GoalStatus = "ACTIVE"
    entities: CanonicalEntities = Field(default_factory=CanonicalEntities)
    constraints: Dict[str, Any] = Field(default_factory=dict)
    strategy: str = "BALANCED"
    current_plan: List[Dict[str, Any]] = Field(default_factory=list)
    completed_steps: List[str] = Field(default_factory=list)
    pending_steps: List[str] = Field(default_factory=list)
    blocked_steps: List[str] = Field(default_factory=list)
    relevant_memories: List[str] = Field(default_factory=list)  # memory_ids
    last_verified_outcome: Optional[Dict[str, Any]] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    def update_strategy(self, new_strategy: str) -> bool:
        """Updates goal strategy; returns True if strategy actually changed."""
        if new_strategy and new_strategy != self.strategy:
            self.strategy = new_strategy
            self.entities.strategy = new_strategy
            self.updated_at = datetime.now(timezone.utc).isoformat()
            return True
        return False

    def update_entities(self, new_entities: CanonicalEntities):
        for field, val in new_entities.model_dump(exclude_none=True).items():
            setattr(self.entities, field, val)
        self.updated_at = datetime.now(timezone.utc).isoformat()

    def complete_step(self, step_name: str, result: Optional[Any] = None):
        if step_name in self.pending_steps:
            self.pending_steps.remove(step_name)
        if step_name not in self.completed_steps:
            self.completed_steps.append(step_name)
        self.updated_at = datetime.now(timezone.utc).isoformat()

    def set_status(self, new_status: GoalStatus):
        self.status = new_status
        self.updated_at = datetime.now(timezone.utc).isoformat()

    def record_verified_outcome(self, outcome: Dict[str, Any]):
        self.last_verified_outcome = outcome
        self.updated_at = datetime.now(timezone.utc).isoformat()
