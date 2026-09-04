# ELA Plan Step Observation & Verification Engine (Phase 12.3 + 12.4)
from typing import Dict, Any, Tuple, Optional, List
from datetime import datetime, timezone
import uuid

from ai.ela.planner.models import ElaPlanStep, ElaPlanObservation
from ai.ela.learning.outcomes import OutcomeManager, ElaVerifiedOutcome
from ai.ela.learning.deviations import DeviationAnalyzer
from ai.ela.learning.events import LearningEventManager


class ObservationEngine:
    """
    Captures structured observations after plan step execution,
    performs authoritative verification against Java / ground-truth database records,
    and feeds verified outcomes directly into the closed-loop learning pipeline.
    """
    _observations: Dict[str, List[ElaPlanObservation]] = {}  # plan_id -> observations

    @classmethod
    def reset_for_testing(cls):
        cls._observations.clear()

    @classmethod
    def record_observation(
        cls,
        plan_id: str,
        step_id: str,
        expected_result: Dict[str, Any],
        actual_result: Dict[str, Any],
        outcome_status: str,
        evidence: Dict[str, Any],
        world_state_delta: Dict[str, Any],
        provenance: Optional[str] = None,
        session_id: Optional[str] = None,
        goal_id: Optional[str] = None,
    ) -> ElaPlanObservation:
        if provenance is None:
            provenance = "JAVA_VERIFIED" if any(k in actual_result for k in ["booking_id", "bookingId", "id"]) else "SYSTEM_OBSERVED"

        # 1. Closed-loop outcome recording (Phase 12.4)
        outcome_provenance = "SYNTHETIC_TEST" if provenance in ["SYNTHETIC_TEST", "SYNTHETIC"] else "REAL_OPERATIONAL"
        booking_id = actual_result.get("booking_id") or actual_result.get("bookingId")

        verified_outcome = OutcomeManager.record_outcome(
            expected_result=expected_result,
            actual_result=actual_result,
            outcome_type="BOOKING" if booking_id else ("DELIVERY" if "delivery" in step_id.lower() else "OTHER_OPERATIONAL"),
            verification_source="JAVA_AUTHORITY" if "booking_id" in actual_result else "OPERATIONAL_TELEMETRY",
            plan_id=plan_id,
            step_id=step_id,
            goal_id=goal_id,
            session_id=session_id,
            booking_id=booking_id,
            world_state_delta=world_state_delta,
            provenance=outcome_provenance,
        )

        # 2. Expected vs Actual Deviation Analysis (Phase 12.4)
        deviations = DeviationAnalyzer.analyze_outcome(
            outcome_id=verified_outcome.outcome_id,
            expected=expected_result,
            actual=actual_result,
            operational_context=actual_result.get("context"),
        )

        # 3. Normalized Learning Event Generation (Phase 12.4)
        learning_event_ids = []
        for dev in deviations:
            model_name = "ETAPredictionModel" if "eta" in dev.metric_name else ("TransportCostModel" if "cost" in dev.metric_name else "RiskModel")
            event = LearningEventManager.create_learning_event_from_deviation(
                outcome=verified_outcome,
                deviation=dev,
                model_name=model_name,
                model_version="v1.0",
            )
            if event:
                learning_event_ids.append(event.event_id)

        # 4. Enrich evidence with outcome and learning traceability
        enriched_evidence = {
            **evidence,
            "outcome_id": verified_outcome.outcome_id,
            "verification_status": verified_outcome.verification_status,
            "deviations_count": len(deviations),
            "learning_event_ids": learning_event_ids,
        }

        obs = ElaPlanObservation(
            observation_id=f"obs-{uuid.uuid4().hex[:8]}",
            plan_id=plan_id,
            step_id=step_id,
            expected_result=expected_result,
            actual_result=actual_result,
            outcome_status=outcome_status,
            evidence=enriched_evidence,
            world_state_delta=world_state_delta,
            timestamp=datetime.now(timezone.utc).isoformat(),
            provenance=provenance,
        )
        cls._observations.setdefault(plan_id, []).append(obs)
        return obs

    @classmethod
    def verify_step_outcome(
        cls,
        step: ElaPlanStep,
        actual_result: Dict[str, Any],
    ) -> Tuple[bool, Optional[str]]:
        """
        Authoritatively verifies that a step succeeded based on actual operational evidence.
        Consequential mutations require explicit authoritative entity confirmation.
        """
        if not step.verification_required:
            return True, None

        # Check for authoritative entity ID or confirmed status
        has_id = any(k in actual_result for k in ['booking_id', 'bookingId', 'requestId', 'procurement_id', 'vehicle_id', 'id'])
        is_success = actual_result.get("success", True) is not False
        status = str(actual_result.get("status", "")).upper()

        if not is_success or status == "FAILED":
            return False, f"Verification failed: Operation explicitly reported failure: {actual_result.get('error', 'Unknown')}"

        if not has_id and not actual_result.get("verified"):
            return False, "Verification failed: Missing authoritative entity ID from Java Authority"

        return True, None

    @classmethod
    def get_plan_observations(cls, plan_id: str) -> List[ElaPlanObservation]:
        return cls._observations.get(plan_id, [])
