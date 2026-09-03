# ELA Governed Memory Writer & Security Policy (Phase 12.2)
from typing import Dict, Any, Optional, Tuple
from datetime import datetime, timezone

from ai.ela.memory.records import (
    ElaMemoryRecord,
    MemoryCategory,
    MemoryProvenance,
    EvidenceClass,
    RetentionPolicy,
    MemorySensitivity,
)
from ai.ela.memory.store import CognitiveMemoryStore
from ai.ela.memory.contradiction import ContradictionDetector
from ai.ela.memory.session import PrivacySanitizer
from ai.ela.security.guard import SecurityGuard


class GovernedMemoryWriter:
    """
    Authoritative write policy engine for ELA Cognitive Memory.
    Enforces that:
    1. Secrets, passwords, OTPs, and tokens are NEVER stored.
    2. Hallucinations and speculative assistant text are rejected.
    3. Contradictions are detected and superseded atomically.
    4. Provenance and evidentiary weights are accurately assigned.
    """

    FORBIDDEN_CONTENT_TRIGGERS = [
        "as an ai language model",
        "i think you might like",
        "speculatively speaking",
        "hallucinated",
    ]

    @classmethod
    def create_memory(
        cls,
        session_id: str,
        user_id: Optional[str],
        goal_id: Optional[str],
        memory_type: MemoryCategory,
        content: str,
        structured_data: Dict[str, Any],
        provenance: MemoryProvenance,
        evidence_class: EvidenceClass,
        importance: float = 0.5,
        sensitivity: MemorySensitivity = "OPERATIONAL",
        retention_policy: RetentionPolicy = "ACTIVE_GOAL",
        ttl_seconds: Optional[int] = None,
    ) -> Tuple[Optional[ElaMemoryRecord], bool, str]:
        """
        Validates, sanitizes, and writes a memory candidate.
        Returns: (record, accepted, reason)
        """
        # 1. Security check: Reject raw credentials
        safety = SecurityGuard.check_safety(content, "AUTHENTICATED_USER" if user_id else "GUEST")
        if safety.credential_shielded or not safety.sanitized:
            return None, False, "REJECTED_CREDENTIAL_SHIELD_TRIGGERED"

        # 2. Speculation & Hallucination Filter
        content_lower = content.lower()
        if any(trigger in content_lower for trigger in cls.FORBIDDEN_CONTENT_TRIGGERS):
            return None, False, "REJECTED_SPECULATIVE_OR_NON_FACTUAL"

        if len(content.strip()) < 3:
            return None, False, "REJECTED_TRIVIAL_CONTENT"

        # 3. Privacy Sanitization
        sanitized_content = PrivacySanitizer.sanitize_text(content) or ""
        sanitized_data = PrivacySanitizer.sanitize_dict(structured_data)

        # 4. Check for contradiction against existing active memories
        active_memories = CognitiveMemoryStore.get_active_records(session_id=session_id, user_id=user_id)
        
        # Strategy shift arbitration
        new_strat = sanitized_data.get("strategy")
        if new_strat and new_strat != "BALANCED":
            conflict = ContradictionDetector.detect_strategy_conflict(
                current_strategy=new_strat,
                active_goal_id=goal_id,
                existing_memories=active_memories,
            )
            if conflict:
                old_mem, reason = conflict
                # Supersede the old memory
                new_rec = ElaMemoryRecord(
                    session_id=session_id,
                    user_id=user_id,
                    goal_id=goal_id,
                    memory_type=memory_type,
                    content=sanitized_content,
                    structured_data=sanitized_data,
                    source="user_dialogue",
                    provenance=provenance,
                    evidence_class=evidence_class,
                    importance=importance,
                    sensitivity=sensitivity,
                    retention_policy=retention_policy,
                    ttl_seconds=ttl_seconds,
                )
                CognitiveMemoryStore.supersede(old_mem.memory_id, new_rec, conflict_type="STRATEGY_SHIFT")
                return new_rec, True, f"ACCEPTED_SUPERSEDING_{old_mem.memory_id}"

        # 5. Calculate expiration if TTL provided
        expires_at = None
        if ttl_seconds:
            import datetime as dt
            exp_time = dt.datetime.now(dt.timezone.utc) + dt.timedelta(seconds=ttl_seconds)
            expires_at = exp_time.isoformat()

        record = ElaMemoryRecord(
            session_id=session_id,
            user_id=user_id,
            goal_id=goal_id,
            memory_type=memory_type,
            content=sanitized_content,
            structured_data=sanitized_data,
            source="governed_writer",
            provenance=provenance,
            evidence_class=evidence_class,
            importance=importance,
            sensitivity=sensitivity,
            retention_policy=retention_policy,
            ttl_seconds=ttl_seconds,
            expires_at=expires_at,
        )

        CognitiveMemoryStore.create(record)
        return record, True, "ACCEPTED"
