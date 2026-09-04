# ELA Expected vs Actual Deviation & Error Categorization (Phase 12.4)
from typing import Dict, Any, List, Optional, Literal
from pydantic import BaseModel, Field
import uuid

ErrorCategory = Literal[
    "MODEL_ERROR",
    "DATA_DRIFT",
    "CONTEXT_SHIFT",
    "OPERATIONAL_FAILURE",
    "EXOGENOUS_EVENT",
    "EXECUTION_ERROR",
    "PLAN_ERROR",
    "INPUT_ERROR",
    "UNKNOWN",
]


class DeviationResult(BaseModel):
    """
    Structured deviation measurement between plan/model expectations and authoritative outcome.
    """
    deviation_id: str = Field(default_factory=lambda: f"dev-{uuid.uuid4().hex[:8]}")
    outcome_id: str
    metric_name: str
    predicted_value: float = 0.0
    actual_value: float = 0.0
    residual_or_error: float = 0.0
    expected_value: Optional[float] = None
    residual: Optional[float] = None
    percentage_error: Optional[float] = None
    error_category: ErrorCategory = "UNKNOWN"
    details: Dict[str, Any] = Field(default_factory=dict)

    def model_post_init(self, __context: Any) -> None:
        if self.expected_value is not None and self.predicted_value == 0.0:
            self.predicted_value = self.expected_value
        elif self.expected_value is None:
            self.expected_value = self.predicted_value

        if self.residual is not None and self.residual_or_error == 0.0:
            self.residual_or_error = self.residual
        elif self.residual is None:
            self.residual = self.residual_or_error

    @property
    def is_significant(self) -> bool:
        return abs(self.residual_or_error) >= 15.0 or (self.percentage_error is not None and self.percentage_error >= 15.0)


class ErrorCategorizer:
    """
    Categorizes the root cause of observed deviations.
    Guarantees that exogenous events (e.g. road closures, weather, mechanical failure)
    are not falsely attributed to model inaccuracies.
    """
    @classmethod
    def categorize(
        cls,
        metric_name: str,
        predicted_val: Optional[float] = None,
        actual_val: Optional[float] = None,
        operational_context: Optional[Dict[str, Any]] = None,
        expected: Optional[float] = None,
        actual: Optional[float] = None,
        residual: Optional[float] = None,
        **kwargs: Any,
    ) -> ErrorCategory:
        ctx = operational_context or {}

        # 1. Exogenous external events (road closures, natural weather, accidents)
        if any(ctx.get(k) for k in ["road_closure", "road_closed", "road_block", "weather_disruption", "weather", "natural_calamity", "expressway_strike"]):
            return "EXOGENOUS_EVENT"

        # 2. Operational hardware/carrier failures
        if any(ctx.get(k) for k in ["vehicle_breakdown", "mechanical_failure", "engine_breakdown", "driver_cancellation", "carrier_refusal"]):
            return "OPERATIONAL_FAILURE"

        # 3. Input corruption or missing parameters
        if any(ctx.get(k) for k in ["bad_origin", "invalid_coordinates", "missing_input"]):
            return "INPUT_ERROR"

        # 4. Plan/DAG structural errors
        if any(ctx.get(k) for k in ["plan_cycle", "precondition_failed", "unmet_dependency"]):
            return "PLAN_ERROR"

        # 5. Execution runtime failures
        if ctx.get("tool_execution_failed") or ctx.get("network_timeout"):
            return "EXECUTION_ERROR"

        # 6. Context shifts (seasonal festival, unexpected surge)
        if ctx.get("diwali_surge") or ctx.get("holiday_gridlock"):
            return "CONTEXT_SHIFT"

        # 7. Model error (pure prediction residual in normal conditions)
        return "MODEL_ERROR"


class DeviationAnalyzer:
    """
    Mathematical residual analyzer computing expected vs actual deviations across operational signals.
    Does NOT invent metrics when no actual ground truth exists.
    """
    @classmethod
    def analyze_outcome(
        cls,
        outcome_id: str,
        expected: Dict[str, Any],
        actual: Dict[str, Any],
        operational_context: Optional[Dict[str, Any]] = None,
    ) -> List[DeviationResult]:
        deviations: List[DeviationResult] = []
        ctx = operational_context or actual.get("context", {})

        # 1. ETA Deviation (Minutes or Hours)
        pred_eta = expected.get("eta_minutes") or expected.get("duration_minutes") or expected.get("eta")
        act_eta = actual.get("actual_eta_minutes") or actual.get("actual_duration_minutes") or actual.get("duration_minutes") or actual.get("actual_eta") or actual.get("eta_minutes")
        if pred_eta is not None and act_eta is not None:
            try:
                p = float(pred_eta)
                a = float(act_eta)
                res = a - p  # positive means took longer than predicted
                pct = (abs(res) / max(1e-4, abs(p))) * 100.0
                cat = ErrorCategorizer.categorize("eta", p, a, ctx)
                deviations.append(
                    DeviationResult(
                        outcome_id=outcome_id,
                        metric_name="eta_minutes",
                        predicted_value=p,
                        actual_value=a,
                        residual_or_error=round(res, 2),
                        percentage_error=round(pct, 2),
                        error_category=cat,
                        details={"unit": "minutes", "context": ctx},
                    )
                )
            except (ValueError, TypeError):
                pass

        # 2. Freight Cost Deviation (Rupees)
        pred_cost = expected.get("cost") or expected.get("estimatedFreight") or expected.get("estimated_cost") or expected.get("freight")
        act_cost = actual.get("cost") or actual.get("final_cost") or actual.get("actual_cost") or actual.get("freight") or actual.get("settled_freight")
        if pred_cost is not None and act_cost is not None:
            try:
                p = float(pred_cost)
                a = float(act_cost)
                res = a - p
                pct = (abs(res) / max(1e-4, abs(p))) * 100.0
                cat = ErrorCategorizer.categorize("cost", p, a, ctx)
                deviations.append(
                    DeviationResult(
                        outcome_id=outcome_id,
                        metric_name="cost",
                        predicted_value=p,
                        actual_value=a,
                        residual_or_error=round(res, 2),
                        percentage_error=round(pct, 2),
                        error_category=cat,
                        details={"unit": "INR", "context": ctx},
                    )
                )
            except (ValueError, TypeError):
                pass

        # 3. Delivery / Operational Success (Probability vs 0.0/1.0)
        pred_success = expected.get("success_probability") or expected.get("confidence") or expected.get("score")
        is_success = actual.get("success", actual.get("status") in ["SUCCESS", "COMPLETED", "VERIFIED"])
        if pred_success is not None and is_success is not None:
            try:
                p = float(pred_success)
                a = 1.0 if is_success else 0.0
                res = a - p
                cat = ErrorCategorizer.categorize("success", p, a, ctx)
                deviations.append(
                    DeviationResult(
                        outcome_id=outcome_id,
                        metric_name="delivery_success",
                        predicted_value=p,
                        actual_value=a,
                        residual_or_error=round(res, 3),
                        percentage_error=None,
                        error_category=cat,
                        details={"status": actual.get("status"), "context": ctx},
                    )
                )
            except (ValueError, TypeError):
                pass

        # 4. Transporter Reliability (Predicted Score vs Operational Reality)
        pred_rel = expected.get("reliability_score") or expected.get("reliability")
        act_rel = actual.get("actual_reliability") or actual.get("performance_score")
        if pred_rel is not None and act_rel is not None:
            try:
                p = float(pred_rel)
                a = float(act_rel)
                res = a - p
                cat = ErrorCategorizer.categorize("reliability", p, a, ctx)
                deviations.append(
                    DeviationResult(
                        outcome_id=outcome_id,
                        metric_name="transporter_reliability",
                        predicted_value=p,
                        actual_value=a,
                        residual_or_error=round(res, 3),
                        percentage_error=round((abs(res) / max(1e-4, abs(p))) * 100.0, 2),
                        error_category=cat,
                        details={"context": ctx},
                    )
                )
            except (ValueError, TypeError):
                pass

        return deviations
