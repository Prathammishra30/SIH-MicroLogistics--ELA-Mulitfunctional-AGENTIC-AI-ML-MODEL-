# ELA Unified Cognitive Context Snapshot (Phase 12.2)
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
from datetime import datetime, timezone
import uuid

from ai.ela.memory.records import ElaMemoryRecord
from ai.ela.memory.goal import ElaGoal


class ElaCognitiveContext(BaseModel):
    """
    Unified cognitive context combining user request, persistent goal,
    retrieved cognitive memories, current operational world state, and ML predictions.
    Forms the bridge between Memory, Transformer, Agents, and Decision Support.
    """
    context_id: str = Field(default_factory=lambda: f"ctx-{uuid.uuid4().hex[:8]}")
    session_id: str
    user_id: Optional[str] = None
    role: str = "GUEST"
    language: str = "en"
    current_request_message: str
    active_goal: Optional[ElaGoal] = None
    relevant_memories: List[ElaMemoryRecord] = Field(default_factory=list)
    operational_state: Dict[str, Any] = Field(default_factory=dict)
    predictions: Dict[str, Any] = Field(default_factory=dict)
    constraints: Dict[str, Any] = Field(default_factory=dict)
    strategy: str = "BALANCED"
    contradictions_detected: List[Dict[str, Any]] = Field(default_factory=list)
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    def to_transformer_memory_features(self) -> Dict[str, Any]:
        """
        Extracts structured signals for Transformer input vectorization:
        - Memory counts and category flags
        - Active constraints
        - Previous verified outcomes or decisions
        """
        categories = [m.memory_type for m in self.relevant_memories]
        
        prev_decision = next((m for m in self.relevant_memories if m.memory_type == "DECISION"), None)
        prev_outcome = next((m for m in self.relevant_memories if m.memory_type == "OUTCOME"), None)
        active_const = next((m for m in self.relevant_memories if m.memory_type == "CONSTRAINT"), None)
        active_warn = next((m for m in self.relevant_memories if m.memory_type == "WARNING"), None)

        prev_vehicle = None
        if prev_decision:
            prev_vehicle = prev_decision.structured_data.get("vehicle_type") or prev_decision.structured_data.get("recommended_vehicle")

        return {
            "memory_count": len(self.relevant_memories),
            "has_goal": self.active_goal is not None,
            "goal_id": self.active_goal.goal_id if self.active_goal else None,
            "strategy": self.strategy,
            "memory_categories": categories,
            "has_active_constraint": active_const is not None,
            "has_warning": active_warn is not None,
            "has_decision": prev_decision is not None,
            "has_verified_outcome": prev_outcome is not None,
            "previous_recommended_vehicle": prev_vehicle,
            "previous_decision_summary": prev_decision.content if prev_decision else None,
            "operational_corridor": self.operational_state.get("corridor", "Nashik-Pune"),
            "corridor_delay_mins": self.operational_state.get("corridor_delay_mins", 0.0),
        }
