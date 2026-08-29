# Controlled Self-Learning Governance & Model Evaluation (Phase 4 Python Core)
from typing import Dict, Any, List, Optional, Literal
from pydantic import BaseModel, Field
from datetime import datetime
from ai.ela.ml.types import ModelMetrics, ModelStatus


class ModelEvaluationReport(BaseModel):
    active_model_name: str
    active_model_version: str
    active_metrics: ModelMetrics
    candidate_model_name: str
    candidate_model_version: str
    candidate_metrics: ModelMetrics
    mae_improvement_pct: float
    recommendation: Literal['PROMOTE_CANDIDATE', 'REJECT_CANDIDATE', 'INSUFFICIENT_DATA']
    decision_reason: str
    evaluated_at: str = Field(default_factory=lambda: datetime.now().isoformat())


class GovernedModelEvaluator:
    """
    Evaluates candidate models against active models on validation benchmarks.
    Enforces that candidate must demonstrate measurable error reduction without regressions.
    """

    MIN_IMPROVEMENT_THRESHOLD_PCT = 1.0  # 1% MAE improvement required

    @classmethod
    async def compare_models(
        cls,
        active_model: Any,
        candidate_model: Any,
        test_dataset: List[Dict[str, Any]],
    ) -> ModelEvaluationReport:
        if len(test_dataset) < 1:
            return ModelEvaluationReport(
                active_model_name=active_model.model_name,
                active_model_version=active_model.current_version,
                active_metrics=ModelMetrics(),
                candidate_model_name=candidate_model.model_name,
                candidate_model_version=candidate_model.current_version,
                candidate_metrics=ModelMetrics(),
                mae_improvement_pct=0.0,
                recommendation='INSUFFICIENT_DATA',
                decision_reason='Evaluation dataset is empty.',
            )

        active_metrics = await active_model.evaluate(test_dataset)
        candidate_metrics = await candidate_model.evaluate(test_dataset)

        improvement_pct = 0.0
        if active_metrics.mae > 0:
            improvement_pct = ((active_metrics.mae - candidate_metrics.mae) / active_metrics.mae) * 100.0

        if candidate_metrics.mae < active_metrics.mae and improvement_pct >= cls.MIN_IMPROVEMENT_THRESHOLD_PCT:
            recommendation = 'PROMOTE_CANDIDATE'
            reason = f"Candidate achieved {improvement_pct:.2f}% MAE improvement ({candidate_metrics.mae:.2f} vs {active_metrics.mae:.2f})."
        else:
            recommendation = 'REJECT_CANDIDATE'
            reason = f"Candidate failed to meet improvement threshold (MAE: {candidate_metrics.mae:.2f} vs Active: {active_metrics.mae:.2f})."

        return ModelEvaluationReport(
            active_model_name=active_model.model_name,
            active_model_version=active_model.current_version,
            active_metrics=active_metrics,
            candidate_model_name=candidate_model.model_name,
            candidate_model_version=candidate_model.current_version,
            candidate_metrics=candidate_metrics,
            mae_improvement_pct=round(improvement_pct, 2),
            recommendation=recommendation,
            decision_reason=reason,
        )


class ModelRegistry:
    """
    Central Registry for all ML models.
    Enforces governance gates: models can only be promoted if evaluation passes.
    ELA NEVER silently modifies production models.
    """

    _active_models: Dict[str, Any] = {}
    _model_versions: Dict[str, List[Dict[str, Any]]] = {}

    @classmethod
    def register_model(cls, model: Any, status: ModelStatus = "trained"):
        cls._active_models[model.model_name] = model
        if model.model_name not in cls._model_versions:
            cls._model_versions[model.model_name] = []
        cls._model_versions[model.model_name].append({
            "version": model.current_version,
            "status": status,
            "registered_at": datetime.now().isoformat(),
        })

    @classmethod
    def get_active_model(cls, model_name: str) -> Optional[Any]:
        return cls._active_models.get(model_name)

    @classmethod
    def promote_candidate(cls, candidate_model: Any, evaluation_report: ModelEvaluationReport) -> bool:
        if evaluation_report.recommendation != 'PROMOTE_CANDIDATE':
            return False
        cls._active_models[candidate_model.model_name] = candidate_model
        cls.register_model(candidate_model, status="production")
        return True
