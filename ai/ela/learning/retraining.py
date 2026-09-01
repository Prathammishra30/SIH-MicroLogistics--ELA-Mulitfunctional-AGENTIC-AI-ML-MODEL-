# Governed Retraining Trigger Engine (Phase 7 Real-World Learning & Continuous Intelligence)
from typing import Dict, Any, List, Optional, Literal
from pydantic import BaseModel, Field
from datetime import datetime
from ai.ela.learning.collector import FeedbackCollector
from ai.ela.learning.error_analysis import ErrorAnalysisEngine
from ai.ela.learning.drift import DriftDetector, DriftAnalysisReport
from ai.ela.data.validation import DataQualityValidator


TriggerReason = Literal[
    "SUFFICIENT_NEW_DATA",
    "SYSTEMATIC_MODEL_ERROR",
    "MODEL_PERFORMANCE_DEGRADATION",
    "FEATURE_DRIFT",
    "RECURRING_OPERATIONAL_PATTERN",
    "MANUAL_TRIGGER",
]


class RetrainingProposal(BaseModel):
    proposal_id: str
    model_name: str
    target_candidate_version: str
    trigger_reason: TriggerReason
    eligible_samples_count: int
    data_quality_passed: bool
    summary: str
    is_governed_retrain_ready: bool
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())


class RetrainingTriggerEngine:
    """
    Evaluates learning telemetry, error diagnostics, and drift metrics to determine
    whether candidate model retraining is warranted.
    CRITICAL: Emits proposals only. Never replaces the active production model automatically.
    """

    MIN_NEW_RECORDS_THRESHOLD = 10  # Minimum operational records required to justify training

    @classmethod
    def evaluate_retraining_trigger(
        cls,
        model_name: str,
        current_version: str,
        drift_report: Optional[DriftAnalysisReport] = None,
    ) -> RetrainingProposal:
        records = FeedbackCollector.get_candidate_training_dataset(model_name=model_name)
        valid_records, dq_report = DataQualityValidator.validate_dataset(records)

        eligible_count = len(valid_records)
        proposal_id = f"retrain-prop-{int(datetime.now().timestamp())}"
        cand_ver = f"{current_version}-cand-{len(records) + 1}"

        # 1. Check for Performance Degradation or Feature Drift
        if drift_report and drift_report.is_retraining_warranted:
            return RetrainingProposal(
                proposal_id=proposal_id,
                model_name=model_name,
                target_candidate_version=cand_ver,
                trigger_reason=drift_report.drift_type if drift_report.drift_type != "NO_DRIFT" else "MODEL_PERFORMANCE_DEGRADATION",  # type: ignore
                eligible_samples_count=eligible_count,
                data_quality_passed=dq_report.validation_status == "PASSED",
                summary=f"Retraining triggered due to {drift_report.drift_type}: {drift_report.summary}",
                is_governed_retrain_ready=eligible_count >= cls.MIN_NEW_RECORDS_THRESHOLD and dq_report.validation_status == "PASSED",
            )

        # 2. Check for Systematic Error Routes
        sys_routes = ErrorAnalysisEngine.get_systematic_error_routes()
        if sys_routes:
            return RetrainingProposal(
                proposal_id=proposal_id,
                model_name=model_name,
                target_candidate_version=cand_ver,
                trigger_reason="SYSTEMATIC_MODEL_ERROR",
                eligible_samples_count=eligible_count,
                data_quality_passed=dq_report.validation_status == "PASSED",
                summary=f"Retraining triggered by systematic corridor errors detected on routes: {', '.join(sys_routes)}.",
                is_governed_retrain_ready=eligible_count >= cls.MIN_NEW_RECORDS_THRESHOLD and dq_report.validation_status == "PASSED",
            )

        # 3. Check for Data Volume Threshold
        if eligible_count >= cls.MIN_NEW_RECORDS_THRESHOLD:
            return RetrainingProposal(
                proposal_id=proposal_id,
                model_name=model_name,
                target_candidate_version=cand_ver,
                trigger_reason="SUFFICIENT_NEW_DATA",
                eligible_samples_count=eligible_count,
                data_quality_passed=dq_report.validation_status == "PASSED",
                summary=f"Sufficient new validated operational data accumulated ({eligible_count} samples). Ready for candidate training.",
                is_governed_retrain_ready=dq_report.validation_status == "PASSED",
            )

        # 4. Default: Insufficient Evidence
        return RetrainingProposal(
            proposal_id=proposal_id,
            model_name=model_name,
            target_candidate_version=cand_ver,
            trigger_reason="SUFFICIENT_NEW_DATA",
            eligible_samples_count=eligible_count,
            data_quality_passed=dq_report.validation_status == "PASSED",
            summary=f"Insufficient operational data ({eligible_count}/{cls.MIN_NEW_RECORDS_THRESHOLD} required). No retrain triggered.",
            is_governed_retrain_ready=False,
        )
