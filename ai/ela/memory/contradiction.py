# ELA Contradiction Detection & Recency Arbitration Engine (Phase 12.2)
from typing import Dict, Any, List, Optional, Tuple, Literal
from pydantic import BaseModel, Field
from datetime import datetime, timezone
import uuid

from ai.ela.memory.records import ElaMemoryRecord, EVIDENCE_WEIGHTS

ConflictType = Literal[
    "STRATEGY_SHIFT",             # User changes optimization priority (e.g. CHEAPEST -> MOST_RELIABLE)
    "OPERATIONAL_DISCREPANCY",    # Stale prediction contradicts verified ground truth
    "ENTITY_MISMATCH",            # Contradictory commodity/quantity within same active goal
    "PREFERENCE_REVERSAL",        # User explicitly changes previously held preference
]


class ContradictionRecord(BaseModel):
    """Auditable log of detected and resolved cognitive contradictions."""
    contradiction_id: str = Field(default_factory=lambda: f"contra-{uuid.uuid4().hex[:8]}")
    conflict_type: ConflictType
    superseded_memory_id: str
    winning_memory_id: str
    resolution_rule: str
    explanation: str
    resolved_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class ContradictionDetector:
    """
    Arbitrates conflicts between memory records, user statements, and verified states.
    Enforces that newer user instructions supersede older preferences for an active goal,
    and JAVA_VERIFIED facts supersede MODEL_INFERENCE or stale operational records.
    """

    @classmethod
    def detect_strategy_conflict(
        cls,
        current_strategy: str,
        active_goal_id: Optional[str],
        existing_memories: List[ElaMemoryRecord],
    ) -> Optional[Tuple[ElaMemoryRecord, str]]:
        """
        Checks if the current explicit strategy contradicts an active strategy in memory.
        Returns: (conflicting_memory, reason) if conflict detected, else None.
        """
        if not current_strategy or current_strategy == "BALANCED":
            return None

        for mem in existing_memories:
            if mem.status == "ACTIVE" and mem.memory_type in ["CONSTRAINT", "SEMANTIC"]:
                old_strat = mem.structured_data.get("strategy")
                if old_strat and old_strat.upper() != current_strategy.upper():
                    return mem, f"Strategy shift detected: was '{old_strat}', current is '{current_strategy}'"
        return None

    @classmethod
    def resolve_contradiction(
        cls,
        old_record: ElaMemoryRecord,
        new_record: ElaMemoryRecord,
        conflict_type: ConflictType,
    ) -> ContradictionRecord:
        """
        Applies strict evidence hierarchy and recency rules:
        1. JAVA_VERIFIED always overrides MODEL_INFERENCE or SYSTEM_OBSERVED.
        2. For user preferences/strategies, newer USER_STATED overrides older USER_STATED.
        3. Higher evidence weight wins.
        """
        # Rule 1: Verified operational state beats inference
        if new_record.evidence_class == "VERIFIED" and old_record.evidence_class in ["PREDICTED", "INFERRED"]:
            old_record.mark_superseded(new_record.memory_id)
            return ContradictionRecord(
                conflict_type=conflict_type,
                superseded_memory_id=old_record.memory_id,
                winning_memory_id=new_record.memory_id,
                resolution_rule="PREFER_JAVA_VERIFIED",
                explanation=f"Ground truth fact {new_record.memory_id} supersedes unverified prediction {old_record.memory_id}",
            )

        # Rule 2: Newer user statement overrides older user statement for active goal
        if new_record.provenance == "USER_STATED" and old_record.provenance == "USER_STATED":
            old_record.mark_superseded(new_record.memory_id)
            return ContradictionRecord(
                conflict_type=conflict_type,
                superseded_memory_id=old_record.memory_id,
                winning_memory_id=new_record.memory_id,
                resolution_rule="PREFER_NEWER_USER_STATED",
                explanation=f"New explicit user instruction {new_record.memory_id} supersedes prior instruction {old_record.memory_id}",
            )

        # Rule 3: Evidence weight comparison
        if new_record.evidence_weight >= old_record.evidence_weight:
            old_record.mark_superseded(new_record.memory_id)
            winning_id = new_record.memory_id
            superseded_id = old_record.memory_id
            rule = "PREFER_HIGHER_EVIDENCE"
        else:
            new_record.mark_superseded(old_record.memory_id)
            winning_id = old_record.memory_id
            superseded_id = new_record.memory_id
            rule = "PREFER_EXISTING_STRONG_EVIDENCE"

        return ContradictionRecord(
            conflict_type=conflict_type,
            superseded_memory_id=superseded_id,
            winning_memory_id=winning_id,
            resolution_rule=rule,
            explanation=f"Evidence hierarchy applied: weight {new_record.evidence_weight} vs {old_record.evidence_weight}",
        )
