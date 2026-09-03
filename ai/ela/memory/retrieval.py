# ELA Governed Cognitive Memory Retrieval Engine (Phase 12.2)
import math
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timezone

from ai.ela.memory.records import ElaMemoryRecord
from ai.ela.memory.goal import ElaGoal
from ai.ela.memory.store import CognitiveMemoryStore
from ai.ela.agent.state import CanonicalEntities


class CognitiveMemoryRetriever:
    """
    Ranks and retrieves the most contextually relevant cognitive memory records.
    Filters out stale, superseded, or contradictory items, and prioritizes
    verified evidence and active goal alignment.
    """

    @classmethod
    def retrieve(
        cls,
        session_id: str,
        user_id: Optional[str] = None,
        active_goal: Optional[ElaGoal] = None,
        intent: str = "GENERAL_HELP",
        role: str = "GUEST",
        entities: Optional[CanonicalEntities] = None,
        operational_state: Optional[Dict[str, Any]] = None,
        top_k: int = 5,
    ) -> List[Tuple[ElaMemoryRecord, float]]:
        """
        Retrieves top_k relevant memories scored by evidence, goal relevance, entity overlap, and recency.
        Returns: List of (record, relevance_score) sorted descending by score.
        """
        candidates = CognitiveMemoryStore.get_active_records(session_id=session_id, user_id=user_id)
        if not candidates:
            return []

        scored_records: List[Tuple[ElaMemoryRecord, float]] = []
        now = datetime.now(timezone.utc)

        target_comm = (entities.commodity or entities.product or "").lower() if entities else ""
        target_pickup = (entities.pickup_location or "").lower() if entities else ""
        target_dest = (entities.destination or "").lower() if entities else ""

        for rec in candidates:
            # 1. Base importance and evidentiary weight
            score = (rec.importance * 0.25) + (rec.evidence_weight * 0.25)

            # 2. Active Goal Match (+0.25)
            if active_goal and rec.goal_id == active_goal.goal_id:
                score += 0.25

            # 3. Entity Overlap
            comm_in_rec = str(rec.structured_data.get("commodity") or rec.structured_data.get("product") or "").lower()
            if target_comm and target_comm in comm_in_rec:
                score += 0.15

            pickup_in_rec = str(rec.structured_data.get("pickup_location") or rec.structured_data.get("origin") or "").lower()
            if target_pickup and target_pickup in pickup_in_rec:
                score += 0.10

            dest_in_rec = str(rec.structured_data.get("destination") or "").lower()
            if target_dest and target_dest in dest_in_rec:
                score += 0.10

            # 4. Memory Category Contextual Alignment
            if intent in ["CREATE_LOGISTICS_WORKFLOW", "MOVE_PRODUCE", "GET_AVAILABLE_TRIPS"]:
                if rec.memory_type in ["CONSTRAINT", "WARNING", "DECISION"]:
                    score += 0.15
                elif rec.memory_type == "OPERATIONAL":
                    score += 0.10

            # 5. Temporal Decay (Halves relevance over 4 hours for non-permanent memories)
            if rec.retention_policy != "PERMANENT_AUDIT":
                try:
                    rec_time = datetime.fromisoformat(rec.created_at)
                    if rec_time.tzinfo is None:
                        rec_time = rec_time.replace(tzinfo=timezone.utc)
                    age_mins = max(0.0, (now - rec_time).total_seconds() / 60.0)
                    decay = math.exp(-age_mins / 240.0)
                    score *= (0.7 + 0.3 * decay)
                except Exception:
                    pass

            scored_records.append((rec, round(score, 4)))

        # Sort descending by relevance score
        scored_records.sort(key=lambda item: item[1], reverse=True)
        return scored_records[:top_k]
