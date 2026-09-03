# ELA Cognitive Memory Store & Lifecycle Manager (Phase 12.2)
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
import copy

from ai.ela.memory.records import ElaMemoryRecord
from ai.ela.memory.goal import ElaGoal
from ai.ela.memory.contradiction import ContradictionDetector, ContradictionRecord


class CognitiveMemoryStore:
    """
    In-memory, session/user-scoped storage engine for ELA Cognitive Memory.
    Manages complete memory lifecycle: Create, Read, Update, Invalidate, Supersede, Expire, Archive.
    Guarantees strict tenant/user boundary isolation.
    """
    _records: Dict[str, ElaMemoryRecord] = {}
    _session_index: Dict[str, List[str]] = {}  # session_id -> list of memory_ids
    _user_index: Dict[str, List[str]] = {}     # user_id -> list of memory_ids
    _active_goals: Dict[str, ElaGoal] = {}      # session_id -> ElaGoal
    _contradictions: List[ContradictionRecord] = []

    @classmethod
    def reset_for_testing(cls):
        cls._records.clear()
        cls._session_index.clear()
        cls._user_index.clear()
        cls._active_goals.clear()
        cls._contradictions.clear()

    @classmethod
    def create(cls, record: ElaMemoryRecord) -> ElaMemoryRecord:
        """Stores a new cognitive memory record and indexes it."""
        cls._records[record.memory_id] = record
        cls._session_index.setdefault(record.session_id, []).append(record.memory_id)
        if record.user_id:
            cls._user_index.setdefault(record.user_id, []).append(record.memory_id)
        return record

    @classmethod
    def read(cls, memory_id: str, requesting_user_id: Optional[str] = None) -> Optional[ElaMemoryRecord]:
        """
        Reads a record with identity boundary check.
        If record belongs to a specific authenticated user, requesting user must match.
        """
        rec = cls._records.get(memory_id)
        if not rec:
            return None
        if rec.user_id and requesting_user_id and rec.user_id != requesting_user_id:
            return None  # Authorization Boundary Protection
        return rec

    @classmethod
    def update(cls, memory_id: str, updates: Dict[str, Any]) -> Optional[ElaMemoryRecord]:
        rec = cls._records.get(memory_id)
        if not rec:
            return None
        for k, v in updates.items():
            if hasattr(rec, k):
                setattr(rec, k, v)
        rec.updated_at = datetime.now(timezone.utc).isoformat()
        return rec

    @classmethod
    def invalidate(cls, memory_id: str, reason: str) -> bool:
        rec = cls._records.get(memory_id)
        if rec:
            rec.mark_invalidated(reason)
            return True
        return False

    @classmethod
    def supersede(cls, old_memory_id: str, new_record: ElaMemoryRecord, conflict_type: str = "STRATEGY_SHIFT") -> ContradictionRecord:
        """Atomically marks old record as superseded and records contradiction."""
        old_rec = cls._records[old_memory_id]
        cls.create(new_record)
        contradiction = ContradictionDetector.resolve_contradiction(old_rec, new_record, conflict_type=conflict_type)
        cls._contradictions.append(contradiction)
        return contradiction

    @classmethod
    def expire_stale_records(cls, reference_time: Optional[datetime] = None) -> int:
        """Scans records and transitions expired TTL records to EXPIRED status."""
        expired_count = 0
        ref = reference_time or datetime.now(timezone.utc)
        for rec in cls._records.values():
            if rec.status == "ACTIVE" and rec.is_stale(ref):
                rec.mark_expired()
                expired_count += 1
        return expired_count

    @classmethod
    def archive(cls, memory_id: str) -> bool:
        rec = cls._records.get(memory_id)
        if rec:
            rec.status = "ARCHIVED"
            rec.updated_at = datetime.now(timezone.utc).isoformat()
            return True
        return False

    @classmethod
    def get_active_records(
        cls,
        session_id: str,
        user_id: Optional[str] = None,
    ) -> List[ElaMemoryRecord]:
        """
        Retrieves active, non-expired, non-superseded records for the session/user.
        Enforces cross-user authorization boundaries.
        """
        cls.expire_stale_records()
        memory_ids = cls._session_index.get(session_id, [])
        if user_id:
            memory_ids = list(set(memory_ids + cls._user_index.get(user_id, [])))

        active_records = []
        for mid in memory_ids:
            rec = cls._records.get(mid)
            if not rec:
                continue
            # Security boundary: If record has a user_id and request user doesn't match, reject
            if rec.user_id and user_id and rec.user_id != user_id:
                continue
            if rec.status == "ACTIVE" and not rec.is_stale():
                active_records.append(rec)
        return active_records

    # Goal Management
    @classmethod
    def get_active_goal(cls, session_id: str) -> Optional[ElaGoal]:
        goal = cls._active_goals.get(session_id)
        if goal and goal.status in ["ACTIVE", "WAITING_FOR_USER", "WAITING_FOR_AUTHORIZATION", "EXECUTING", "BLOCKED"]:
            return goal
        return None

    @classmethod
    def set_active_goal(cls, session_id: str, goal: ElaGoal):
        cls._active_goals[session_id] = goal

    @classmethod
    def get_contradictions(cls) -> List[ContradictionRecord]:
        return list(cls._contradictions)
