# ELA Governed Adaptation Proposals & Signal Synthesis (Phase 12.4)
from typing import Dict, Any, List, Optional, Literal
from pydantic import BaseModel, Field
from datetime import datetime, timezone
import numpy as np
import uuid

from ai.ela.learning.events import ElaLearningEvent, LearningEventManager
from ai.ela.learning.outcomes import ProvenanceType

ProposalStatus = Literal[
    "PROPOSED",
    "UNDER_EVALUATION",
    "APPROVED",
    "REJECTED",
    "PROMOTED",
    "ROLLED_BACK",
]


class ElaAdaptationProposal(BaseModel):
    """
    Formal proposal to adapt or retrain a model based on accumulated operational evidence.
    RULE: The proposal never automatically mutates production weights.
    It must proceed through candidate training, holdout evaluation, and ModelGovernanceGate.
    """
    proposal_id: str = Field(default_factory=lambda: f"prop-{uuid.uuid4().hex[:8]}")
    target_model: str
    current_version: str
    proposed_change: str
    reason: str
    evidence_event_ids: List[str] = Field(default_factory=list)
    supporting_sample_count: int
    expected_improvement: float = 0.0
    risk: str = "LOW"
    provenance: ProvenanceType = "REAL_OPERATIONAL"
    status: ProposalStatus = "PROPOSED"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class CorridorAdjustmentSignal(BaseModel):
    """
    Governed operational adjustment signal consumable by planning without magic numbers.
    Stamped with the exact model version and evidence confidence category.
    """
    corridor: str
    delay_offset_minutes: float
    sample_count: int
    confidence_category: Literal["PRELIMINARY", "STATISTICALLY_CONFIDENT"] = "PRELIMINARY"
    model_version: str = "v1.0"
    generated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class AdaptationEngine:
    """
    Engine evaluating operational evidence, detecting systematic corridor biases,
    and generating formal adaptation proposals and planning adjustment signals.
    """
    _proposals: Dict[str, ElaAdaptationProposal] = {}
    _corridor_signals: Dict[str, CorridorAdjustmentSignal] = {}

    MIN_SAMPLES_FOR_PROPOSAL = 5
    MIN_SAMPLES_FOR_STATISTICAL_CONFIDENCE = 10

    @classmethod
    def reset_for_testing(cls):
        cls._proposals.clear()
        cls._corridor_signals.clear()

    @classmethod
    def evaluate_corridor_evidence(
        cls,
        corridor: str,
        target_model: str = "ETAPredictionModel",
        current_version: str = "v1.0",
        provenance: ProvenanceType = "REAL_OPERATIONAL",
    ) -> Optional[CorridorAdjustmentSignal]:
        events = LearningEventManager.get_events(
            model_name=target_model,
            corridor=corridor,
            provenance=provenance,
        )

        if not events:
            return None

        residuals = [e.residual_or_error for e in events if e.residual_or_error is not None]
        if not residuals:
            return None

        sample_count = len(residuals)
        mean_res = float(np.mean(residuals))

        # Small samples (e.g. 1 to 4) are marked PRELIMINARY
        conf: Literal["PRELIMINARY", "STATISTICALLY_CONFIDENT"] = (
            "STATISTICALLY_CONFIDENT" if sample_count >= cls.MIN_SAMPLES_FOR_STATISTICAL_CONFIDENCE else "PRELIMINARY"
        )

        signal = CorridorAdjustmentSignal(
            corridor=corridor,
            delay_offset_minutes=round(mean_res, 1),
            sample_count=sample_count,
            confidence_category=conf,
            model_version=current_version,
        )
        cls._corridor_signals[corridor] = signal

        # If sample count reaches threshold and residual is significant (e.g. >= 15 mins or >= 20%), generate an adaptation proposal
        if sample_count >= cls.MIN_SAMPLES_FOR_PROPOSAL and abs(mean_res) >= 15.0:
            cls.propose_adaptation(
                target_model=target_model,
                current_version=current_version,
                proposed_change=f"Retrain {target_model} with recent corridor telemetry on {corridor} (mean bias: {mean_res:+.1f} min)",
                reason=f"Systematic residual of {mean_res:+.1f} mins detected over {sample_count} verified outcomes on {corridor}.",
                evidence_event_ids=[e.event_id for e in events],
                supporting_sample_count=sample_count,
                expected_improvement=15.0,
                risk="LOW",
                provenance=provenance,
            )

        return signal

    @classmethod
    def propose_adaptation(
        cls,
        target_model: str,
        current_version: str,
        proposed_change: str,
        reason: str,
        evidence_event_ids: List[str],
        supporting_sample_count: int,
        expected_improvement: float = 10.0,
        risk: str = "LOW",
        provenance: ProvenanceType = "REAL_OPERATIONAL",
    ) -> ElaAdaptationProposal:
        proposal = ElaAdaptationProposal(
            target_model=target_model,
            current_version=current_version,
            proposed_change=proposed_change,
            reason=reason,
            evidence_event_ids=evidence_event_ids,
            supporting_sample_count=supporting_sample_count,
            expected_improvement=expected_improvement,
            risk=risk,
            provenance=provenance,
            status="PROPOSED",
        )
        cls._proposals[proposal.proposal_id] = proposal
        return proposal

    @classmethod
    def get_corridor_signal(cls, corridor: str) -> Optional[CorridorAdjustmentSignal]:
        return cls._corridor_signals.get(corridor)

    @classmethod
    def get_proposal(cls, proposal_id: str) -> Optional[ElaAdaptationProposal]:
        return cls._proposals.get(proposal_id)

    @classmethod
    def get_all_proposals(cls) -> List[ElaAdaptationProposal]:
        return list(cls._proposals.values())
