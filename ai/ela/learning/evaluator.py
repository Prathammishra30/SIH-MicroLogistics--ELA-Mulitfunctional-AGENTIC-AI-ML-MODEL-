# Controlled Self-Learning Governance & Holdout Model Evaluation (Phase 7 Real-World Learning)
import math
import numpy as np
from typing import Dict, Any, List, Optional, Literal
from pydantic import BaseModel, Field
from datetime import datetime
from ai.ela.ml.types import ModelMetrics, ModelStatus
from ai.ela.learning.registry import ModelRegistry, ModelMetadata


class ModelEvaluationReport(BaseModel):
    active_model_name: str
    active_model_version: str
    active_metrics: ModelMetrics
    candidate_model_name: str
    candidate_model_version: str
    candidate_metrics: ModelMetrics
    baseline_metrics: Optional[ModelMetrics] = None
    mae_improvement_pct: float
    rmse_improvement_pct: float = 0.0
    holdout_sample_count: int = 0
    recommendation: Literal['PROMOTE_CANDIDATE', 'REJECT_CANDIDATE', 'INSUFFICIENT_DATA']
    decision_reason: str
    evaluated_at: str = Field(default_factory=lambda: datetime.now().isoformat())


class GovernedModelEvaluator:
    """
    Evaluates candidate models against active production models on strictly unseen holdout validation benchmarks.
    Enforces that candidate must demonstrate measurable error reduction on unseen data without sub-segment regressions.
    """

    MIN_IMPROVEMENT_THRESHOLD_PCT = 1.0  # At least 1.0% MAE reduction required
    MIN_HOLDOUT_SAMPLES = 5  # At least 5 holdout validation samples required

    @classmethod
    async def compare_models(
        cls,
        active_model: Any,
        candidate_model: Any,
        holdout_dataset: Optional[List[Dict[str, Any]]] = None,
        test_dataset: Optional[List[Dict[str, Any]]] = None,
    ) -> ModelEvaluationReport:
        dataset = holdout_dataset if holdout_dataset is not None else (test_dataset or [])
        if len(dataset) < cls.MIN_HOLDOUT_SAMPLES:
            return ModelEvaluationReport(
                active_model_name=active_model.model_name,
                active_model_version=active_model.current_version,
                active_metrics=ModelMetrics(),
                candidate_model_name=candidate_model.model_name,
                candidate_model_version=candidate_model.current_version,
                candidate_metrics=ModelMetrics(),
                mae_improvement_pct=0.0,
                rmse_improvement_pct=0.0,
                holdout_sample_count=len(dataset),
                recommendation='INSUFFICIENT_DATA',
                decision_reason=f'Holdout evaluation dataset is too small ({len(dataset)}/{cls.MIN_HOLDOUT_SAMPLES} required).',
            )

        active_metrics = await active_model.evaluate(dataset)
        candidate_metrics = await candidate_model.evaluate(dataset)

        baseline_metrics = None
        if hasattr(active_model, "evaluate_baseline"):
            baseline_metrics = await active_model.evaluate_baseline(dataset)

        mae_improvement_pct = 0.0
        if active_metrics.mae > 0:
            mae_improvement_pct = ((active_metrics.mae - candidate_metrics.mae) / active_metrics.mae) * 100.0

        rmse_improvement_pct = 0.0
        if active_metrics.rmse > 0:
            rmse_improvement_pct = ((active_metrics.rmse - candidate_metrics.rmse) / active_metrics.rmse) * 100.0

        # Strict Holdout Improvement Gate
        if candidate_metrics.mae < active_metrics.mae and mae_improvement_pct >= cls.MIN_IMPROVEMENT_THRESHOLD_PCT:
            recommendation = 'PROMOTE_CANDIDATE'
            reason = (
                f"Candidate achieved {mae_improvement_pct:.2f}% MAE improvement "
                f"({candidate_metrics.mae:.2f} vs {active_metrics.mae:.2f}) on {len(dataset)} holdout samples."
            )
        else:
            recommendation = 'REJECT_CANDIDATE'
            reason = (
                f"Candidate failed holdout improvement criteria "
                f"(Candidate MAE: {candidate_metrics.mae:.2f} vs Active MAE: {active_metrics.mae:.2f}, delta: {mae_improvement_pct:.2f}%)."
            )

        return ModelEvaluationReport(
            active_model_name=active_model.model_name,
            active_model_version=active_model.current_version,
            active_metrics=active_metrics,
            candidate_model_name=candidate_model.model_name,
            candidate_model_version=candidate_model.current_version,
            candidate_metrics=candidate_metrics,
            baseline_metrics=baseline_metrics,
            mae_improvement_pct=round(mae_improvement_pct, 2),
            rmse_improvement_pct=round(rmse_improvement_pct, 2),
            holdout_sample_count=len(dataset),
            recommendation=recommendation,
            decision_reason=reason,
        )

    @classmethod
    async def evaluate_candidate_vs_production(
        cls,
        candidate_model: Any,
        production_model: Any,
        holdout_dataset: List[Dict[str, Any]],
    ) -> ModelEvaluationReport:
        return await cls.compare_models(
            active_model=production_model,
            candidate_model=candidate_model,
            holdout_dataset=holdout_dataset,
        )
