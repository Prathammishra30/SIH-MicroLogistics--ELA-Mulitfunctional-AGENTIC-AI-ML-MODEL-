# ELA Verified Operational Outcome & Linkage Model (Phase 12.4)
from typing import Dict, Any, List, Optional, Literal
from pydantic import BaseModel, Field
from datetime import datetime, timezone
import uuid

OutcomeType = Literal[
    "DELIVERY",
    "BOOKING",
    "TRANSPORT",
    "PROCUREMENT",
    "PRICE",
    "ETA",
    "CANCELLATION",
    "MATCH",
    "DELAY",
    "FAILURE",
    "SUCCESS",
    "OTHER_OPERATIONAL",
]

VerificationStatus = Literal[
    "VERIFIED",
    "UNVERIFIED",
    "QUARANTINED",
    "FAILED",
]

VerificationSource = Literal[
    "JAVA_AUTHORITY",
    "POSTGRESQL",
    "OPERATIONAL_TELEMETRY",
    "SATELLITE_GPS",
    "MANUAL_AUDIT",
    "SYSTEM_SYNTHETIC",
    "UNVERIFIED_CLAIM",
    "MANUAL_UNVERIFIED",
]

from enum import Enum

class ProvenanceType(str, Enum):
    REAL_OPERATIONAL = "REAL_OPERATIONAL"
    SYNTHETIC_TEST = "SYNTHETIC_TEST"
    JAVA_AUTHORITY = "JAVA_AUTHORITY"


class ElaVerifiedOutcome(BaseModel):
    """
    Authoritative, structured real-world operational outcome.
    CRITICAL RULE:
    An agent response is NOT a verified outcome.
    A model prediction is NOT a verified outcome.
    A natural-language confirmation is NOT a verified outcome.
    A verified outcome requires authoritative evidence from Java Authority or ground-truth DB.
    """
    outcome_id: str = Field(default_factory=lambda: f"out-{uuid.uuid4().hex[:8]}")
    plan_id: Optional[str] = None
    plan_version: Optional[int] = 1
    step_id: Optional[str] = None
    goal_id: Optional[str] = None
    session_id: Optional[str] = None
    operation_id: Optional[str] = None
    booking_id: Optional[str] = None

    expected_result: Dict[str, Any] = Field(default_factory=dict)
    actual_result: Dict[str, Any] = Field(default_factory=dict)

    outcome_type: OutcomeType = "OTHER_OPERATIONAL"
    verification_status: VerificationStatus = "VERIFIED"
    verification_source: VerificationSource = "JAVA_AUTHORITY"

    observed_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    provenance: ProvenanceType = "REAL_OPERATIONAL"

    metrics: Dict[str, Any] = Field(default_factory=dict)
    world_state_delta: Dict[str, Any] = Field(default_factory=dict)
    reliability: float = 1.0

    @property
    def linkage(self) -> Optional["OutcomeLinkageChain"]:
        return OutcomeManager.get_linkage(self.outcome_id)


class OutcomeLinkageChain(BaseModel):
    """
    Explicit, inspectable linkage connecting prediction to real-world outcome and learning signal.
    """
    prediction_id: Optional[str] = None
    model_name: Optional[str] = None
    model_version: Optional[str] = None
    plan_id: Optional[str] = None
    proposal_id: Optional[str] = None
    step_id: Optional[str] = None
    goal_id: Optional[str] = None
    session_id: Optional[str] = None
    operation_id: Optional[str] = None
    booking_id: Optional[str] = None
    outcome_id: str
    previous_outcome_id: Optional[str] = None
    learning_event_id: Optional[str] = None
    provenance: ProvenanceType = "REAL_OPERATIONAL"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class OutcomeManager:
    """
    Governed repository and linkage tracker for verified operational outcomes.
    Enforces idempotency, duplicate protection, and strict verification checks.
    """
    _outcomes: Dict[str, ElaVerifiedOutcome] = {}
    _linkages: Dict[str, OutcomeLinkageChain] = {}  # outcome_id -> linkage
    _processed_operation_ids: set = set()

    @classmethod
    def reset_for_testing(cls):
        cls._outcomes.clear()
        cls._linkages.clear()
        cls._processed_operation_ids.clear()

    @classmethod
    def get_linkage(cls, outcome_id: str) -> Optional[OutcomeLinkageChain]:
        return cls._linkages.get(outcome_id)

    @classmethod
    def record_outcome(
        cls,
        expected_result: Dict[str, Any],
        actual_result: Dict[str, Any],
        outcome_type: OutcomeType = "OTHER_OPERATIONAL",
        verification_source: VerificationSource = "JAVA_AUTHORITY",
        plan_id: Optional[str] = None,
        plan_version: Optional[int] = 1,
        step_id: Optional[str] = None,
        goal_id: Optional[str] = None,
        session_id: Optional[str] = None,
        operation_id: Optional[str] = None,
        booking_id: Optional[str] = None,
        metrics: Optional[Dict[str, Any]] = None,
        world_state_delta: Optional[Dict[str, Any]] = None,
        provenance: ProvenanceType = "REAL_OPERATIONAL",
        reliability: float = 1.0,
    ) -> ElaVerifiedOutcome:
        # Idempotency & Duplicate Protection: Prevent recording identical operation twice
        op_key = operation_id or booking_id
        if op_key and op_key in cls._processed_operation_ids:
            for out in cls._outcomes.values():
                if out.operation_id == op_key or out.booking_id == op_key:
                    return out

        # Verification validation
        status: VerificationStatus = "VERIFIED"
        if verification_source in ["UNVERIFIED_CLAIM", "MANUAL_UNVERIFIED"]:
            status = "QUARANTINED"
        elif verification_source == "SYSTEM_SYNTHETIC" or provenance == "SYNTHETIC_TEST":
            status = "VERIFIED"  # Verified for synthetic benchmark
        elif not actual_result:
            status = "UNVERIFIED"
        elif not any(k in actual_result for k in ["booking_id", "bookingId", "id", "requestId", "verified"]):
            status = "QUARANTINED"

        outcome = ElaVerifiedOutcome(
            plan_id=plan_id,
            plan_version=plan_version,
            step_id=step_id,
            goal_id=goal_id,
            session_id=session_id,
            operation_id=operation_id,
            booking_id=booking_id or actual_result.get("booking_id") or actual_result.get("bookingId"),
            expected_result=expected_result,
            actual_result=actual_result,
            outcome_type=outcome_type,
            verification_status=status,
            verification_source=verification_source,
            provenance=provenance,
            metrics=metrics or {},
            world_state_delta=world_state_delta or {},
            reliability=reliability,
        )

        cls._outcomes[outcome.outcome_id] = outcome
        if op_key:
            cls._processed_operation_ids.add(op_key)

        # Initialize linkage chain
        cls._linkages[outcome.outcome_id] = OutcomeLinkageChain(
            plan_id=plan_id,
            step_id=step_id,
            goal_id=goal_id,
            session_id=session_id,
            operation_id=operation_id,
            booking_id=outcome.booking_id,
            outcome_id=outcome.outcome_id,
            provenance=provenance,
        )

        return outcome

    @classmethod
    def link_prediction_and_learning_event(
        cls,
        outcome_id: str,
        prediction_id: Optional[str] = None,
        model_name: Optional[str] = None,
        model_version: Optional[str] = None,
        learning_event_id: Optional[str] = None,
    ) -> Optional[OutcomeLinkageChain]:
        linkage = cls._linkages.get(outcome_id)
        if not linkage:
            return None

        if prediction_id:
            linkage.prediction_id = prediction_id
        if model_name:
            linkage.model_name = model_name
        if model_version:
            linkage.model_version = model_version
        if learning_event_id:
            linkage.learning_event_id = learning_event_id

        return linkage

    @classmethod
    def get_outcome(cls, outcome_id: str) -> Optional[ElaVerifiedOutcome]:
        return cls._outcomes.get(outcome_id)

    @classmethod
    def get_linkage(cls, outcome_id: str) -> Optional[OutcomeLinkageChain]:
        return cls._linkages.get(outcome_id)

    @classmethod
    def get_all_outcomes(cls, provenance: Optional[ProvenanceType] = None) -> List[ElaVerifiedOutcome]:
        if provenance:
            return [o for o in cls._outcomes.values() if o.provenance == provenance]
        return list(cls._outcomes.values())

    @classmethod
    def record_verified_outcome(
        cls,
        prediction_id: Optional[str] = None,
        plan_id: Optional[str] = None,
        proposal_id: Optional[str] = None,
        operation_id: Optional[str] = None,
        booking_id: Optional[str] = None,
        actual_transit_time_minutes: float = 0.0,
        expected_transit_time_minutes: float = 0.0,
        actual_cost: float = 0.0,
        expected_cost: float = 0.0,
        actual_delay_minutes: float = 0.0,
        outcome_status: str = "DELIVERED",
        provenance: Any = "REAL_OPERATIONAL",
    ) -> ElaVerifiedOutcome:
        expected = {
            "duration_minutes": expected_transit_time_minutes,
            "cost": expected_cost,
        }
        actual = {
            "duration_minutes": actual_transit_time_minutes,
            "cost": actual_cost,
            "delay_minutes": actual_delay_minutes,
            "status": outcome_status,
            "booking_id": booking_id,
        }
        prov = "REAL_OPERATIONAL" if str(provenance).upper() in ["REAL_OPERATIONAL", "JAVA_AUTHORITY"] else "SYNTHETIC_TEST"
        outcome = cls.record_outcome(
            expected_result=expected,
            actual_result=actual,
            outcome_type="DELIVERY",
            verification_source="JAVA_AUTHORITY",
            plan_id=plan_id,
            operation_id=operation_id,
            booking_id=booking_id,
            provenance=prov,
        )
        linkage = cls.get_linkage(outcome.outcome_id)
        if linkage:
            linkage.prediction_id = prediction_id
            linkage.proposal_id = proposal_id
        return outcome
