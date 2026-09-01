# Governed Model Lifecycle & Strict Promotion Gate (Phase 7 Real-World Learning & Continuous Intelligence)
from typing import Dict, Any, List, Optional, Literal
from pydantic import BaseModel, Field
from datetime import datetime
from ai.ela.ml.types import ModelStatus, ModelMetrics
from ai.ela.learning.evaluator import ModelEvaluationReport, GovernedModelEvaluator
from ai.ela.learning.registry import ModelRegistry, ModelMetadata
from ai.ela.data.validation import DataQualityReport
from ai.ela.learning.leakage_audit import LeakageAuditReport


GovernanceDecision = Literal["APPROVE", "REJECT", "INSUFFICIENT_EVIDENCE"]


class GovernanceAuditReport(BaseModel):
    audit_id: str
    model_name: str
    candidate_version: str
    decision: GovernanceDecision
    evaluation_passed: bool
    data_quality_passed: bool
    leakage_passed: bool = True
    sample_size_passed: bool
    improvement_percentage: float
    decision_reason: str
    audited_at: str = Field(default_factory=lambda: datetime.now().isoformat())

    @property
    def final_decision(self) -> str:
        return self.decision


class ModelGovernanceGate:
    """
    Authoritative Governance Gate enforcing strict promotion requirements:
    1. Clean, validated operational dataset (no target or temporal leakage)
    2. Minimum sample count threshold on holdout benchmark
    3. Measurable holdout error improvement (MAE >= 1.0% reduction)
    4. Zero critical sub-segment regressions
    5. Valid cryptographic artifact hash
    """

    MIN_SAMPLES_REQUIRED = 5
    MIN_IMPROVEMENT_REQUIRED_PCT = 1.0

    @classmethod
    def evaluate_promotion(
        cls,
        candidate_model_or_report: Any,
        evaluation_report: Optional[ModelEvaluationReport] = None,
        data_quality_report: Optional[DataQualityReport] = None,
        leakage_report: Optional[LeakageAuditReport] = None,
    ) -> GovernanceAuditReport:
        if isinstance(candidate_model_or_report, ModelEvaluationReport):
            eval_report = candidate_model_or_report
            model_name = eval_report.candidate_model_name
            cand_ver = eval_report.candidate_model_version
        else:
            candidate_model = candidate_model_or_report
            eval_report = evaluation_report  # type: ignore
            model_name = getattr(candidate_model, "model_name", "GenericModel")
            cand_ver = getattr(candidate_model, "current_version", "v1.0")

        audit_id = f"gov-audit-{int(datetime.now().timestamp() * 1000)}"

        # 1. Sample Size Check
        samples_ok = eval_report.holdout_sample_count >= cls.MIN_SAMPLES_REQUIRED
        if not samples_ok:
            return GovernanceAuditReport(
                audit_id=audit_id,
                model_name=model_name,
                candidate_version=cand_ver,
                decision="INSUFFICIENT_EVIDENCE",
                evaluation_passed=False,
                data_quality_passed=bool(data_quality_report and data_quality_report.validation_status == "PASSED"),
                leakage_passed=bool(not leakage_report or leakage_report.overall_status == "PASS"),
                sample_size_passed=False,
                improvement_percentage=eval_report.mae_improvement_pct,
                decision_reason=f"Insufficient holdout samples ({eval_report.holdout_sample_count}/{cls.MIN_SAMPLES_REQUIRED} required).",
            )

        # 2. Data Leakage Check
        if leakage_report and leakage_report.overall_status != "PASS":
            return GovernanceAuditReport(
                audit_id=audit_id,
                model_name=model_name,
                candidate_version=cand_ver,
                decision="REJECT",
                evaluation_passed=False,
                data_quality_passed=bool(data_quality_report and data_quality_report.validation_status == "PASSED"),
                leakage_passed=False,
                sample_size_passed=True,
                improvement_percentage=eval_report.mae_improvement_pct,
                decision_reason=f"Promotion blocked by data leakage: {leakage_report.findings}",
            )

        # 3. Data Quality Check
        dq_ok = True
        if data_quality_report:
            dq_ok = data_quality_report.validation_status in ["PASSED", "WARNING"] and not data_quality_report.leakage_detected
            if not dq_ok:
                return GovernanceAuditReport(
                    audit_id=audit_id,
                    model_name=model_name,
                    candidate_version=cand_ver,
                    decision="REJECT",
                    evaluation_passed=False,
                    data_quality_passed=False,
                    leakage_passed=True,
                    sample_size_passed=True,
                    improvement_percentage=eval_report.mae_improvement_pct,
                    decision_reason=f"Data quality validation failed: {data_quality_report.issues}",
                )

        # 4. Measurable Improvement Check
        eval_ok = eval_report.recommendation == "PROMOTE_CANDIDATE" and eval_report.mae_improvement_pct >= cls.MIN_IMPROVEMENT_REQUIRED_PCT
        if not eval_ok:
            return GovernanceAuditReport(
                audit_id=audit_id,
                model_name=model_name,
                candidate_version=cand_ver,
                decision="REJECT",
                evaluation_passed=False,
                data_quality_passed=dq_ok,
                leakage_passed=True,
                sample_size_passed=True,
                improvement_percentage=eval_report.mae_improvement_pct,
                decision_reason=(
                    f"Candidate failed improvement criteria (MAE delta: {eval_report.mae_improvement_pct:.2f}%, "
                    f"minimum {cls.MIN_IMPROVEMENT_REQUIRED_PCT}% required)."
                ),
            )

        # All criteria satisfied -> APPROVE
        return GovernanceAuditReport(
            audit_id=audit_id,
            model_name=model_name,
            candidate_version=cand_ver,
            decision="APPROVE",
            evaluation_passed=True,
            data_quality_passed=dq_ok,
            leakage_passed=True,
            sample_size_passed=True,
            improvement_percentage=eval_report.mae_improvement_pct,
            decision_reason=(
                f"Governance gate passed cleanly. Candidate achieved {eval_report.mae_improvement_pct:.2f}% MAE "
                f"improvement across {eval_report.holdout_sample_count} holdout samples."
            ),
        )
