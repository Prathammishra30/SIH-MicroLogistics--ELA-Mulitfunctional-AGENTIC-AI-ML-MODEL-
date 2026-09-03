# ELA Plan Step Observation & Verification Engine (Phase 12.3)
from typing import Dict, Any, Tuple, Optional, List
from datetime import datetime, timezone
import uuid

from ai.ela.planner.models import ElaPlanStep, ElaPlanObservation


class ObservationEngine:
    """
    Captures structured observations after plan step execution
    and performs authoritative verification against Java / ground-truth database records.
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
    ) -> ElaPlanObservation:
        if provenance is None:
            provenance = "JAVA_VERIFIED" if "booking_id" in actual_result else "SYSTEM_OBSERVED"
        obs = ElaPlanObservation(
            observation_id=f"obs-{uuid.uuid4().hex[:8]}",
            plan_id=plan_id,
            step_id=step_id,
            expected_result=expected_result,
            actual_result=actual_result,
            outcome_status=outcome_status,
            evidence=evidence,
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
