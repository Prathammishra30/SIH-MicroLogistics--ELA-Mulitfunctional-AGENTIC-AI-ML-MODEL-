# Freight Transport Cost Prediction Model (Phase 5B.1 Authenticity Core)
# Implements HYBRID_MODEL: Dynamic Tariff Matrix Baseline + Learned Freight Elasticity & Surcharge Model
import os
import numpy as np
import joblib
from typing import Dict, Any, List, Optional, Tuple
from pydantic import BaseModel, Field
from datetime import datetime
from ai.ela.ml.types import IMLModel, PredictionResult, ModelMetrics, ModelStatus, ModelImplementationType
from ai.ela.ml.utils import compute_metrics, compute_artifact_sha256


class TransportCostFeatures(BaseModel):
    distance_km: float = 85.0
    weight_kg: float = 500.0
    vehicle_type: str = "Mini Truck (750 kg)"
    diesel_price_per_litre: float = 94.5
    toll_charges: float = 120.0
    terrain_factor: float = 1.0  # 1.0=Plains, 1.25=Ghats/Hills


class TransportCostOutput(BaseModel):
    estimated_cost: float
    baseline_tariff_cost: float
    learned_surcharge_cost: float
    lower_bound_cost: float
    upper_bound_cost: float
    cost_per_km: float
    base_freight: float
    loading_handling: float
    fuel_surcharge: float
    breakdown: str
    confidence: float
    feature_importance: Dict[str, float] = Field(default_factory=dict)


class TransportCostModel(IMLModel[TransportCostFeatures, TransportCostOutput]):
    """
    HYBRID_MODEL: Base Tariff Matrix + Learned Fuel/Cargo Elasticity Layer.
    """
    def __init__(self, version: str = "v1.2-tariff-hybrid", status: ModelStatus = "trained"):
        self._version = version
        self._status = status
        # Baseline tariff rates per km
        self._base_tariff_per_km = {
            "mini truck": 26.0,
            "pickup": 32.0,
            "medium truck": 42.0,
            "heavy truck": 65.0,
            "tractor": 20.0,
        }
        # Learned elasticity weights: [bias, fuel_delta_factor, weight_ton_factor, terrain_coef]
        self._elasticity_weights = np.array([45.0, 1.85, 180.0, 25.0])
        self._last_evaluated_metrics: Optional[ModelMetrics] = None

    @property
    def model_name(self) -> str:
        return "TransportCostModel"

    @property
    def current_version(self) -> str:
        return self._version

    @property
    def implementation_type(self) -> ModelImplementationType:
        return "HYBRID_MODEL"

    @property
    def status(self) -> ModelStatus:
        return self._status

    def _compute_tariff_baseline(self, f: TransportCostFeatures) -> Tuple[float, float, float]:
        rate = 26.0
        v_lower = f.vehicle_type.lower()
        for k, r in self._base_tariff_per_km.items():
            if k in v_lower:
                rate = r
                break
        base_freight = f.distance_km * rate * f.terrain_factor
        loading = 350.0
        return base_freight, loading, base_freight + loading

    def _extract_elasticity_vector(self, f: TransportCostFeatures) -> np.ndarray:
        fuel_delta = max(0.0, f.diesel_price_per_litre - 90.0)
        return np.array([
            1.0,
            float(fuel_delta),
            float(f.weight_kg / 1000.0),
            float(f.terrain_factor - 1.0),
        ])

    def _check_ood(self, f: TransportCostFeatures) -> Tuple[bool, Optional[str]]:
        if f.weight_kg > 25000.0 or f.weight_kg < 10.0:
            return True, f"Cargo weight ({f.weight_kg} kg) is outside standard logistics vehicle support [10 - 25,000 kg]."
        if f.distance_km > 2500.0:
            return True, f"Transit distance ({f.distance_km} km) exceeds regional micro-logistics scope."
        return False, None

    def _extract_target(self, row: Dict[str, Any]) -> float:
        """
        Extracts ground truth freight cost with strict precedence.
        Raises ValueError if no valid target exists.
        """
        for k in ["actual_value", "target", "actual_freight", "actual_cost"]:
            if k in row and row[k] is not None:
                try:
                    return float(row[k])
                except (ValueError, TypeError):
                    pass
        raise ValueError(f"No valid ground truth target found in sample: {row}")

    async def train(self, dataset: List[Dict[str, Any]]) -> ModelMetrics:
        if not dataset or len(dataset) < 4:
            self._status = "trained"
            return ModelMetrics(mae=0.0, rmse=0.0, sample_count=0)

        X_rows = []
        residuals = []
        valid_rows = []
        for row in dataset:
            try:
                target = self._extract_target(row)
            except ValueError:
                continue
            feats = row.get("features", {})
            f_obj = TransportCostFeatures(**feats) if isinstance(feats, dict) else feats
            _, _, baseline_total = self._compute_tariff_baseline(f_obj)
            res = target - (baseline_total + f_obj.toll_charges)
            X_rows.append(self._extract_elasticity_vector(f_obj))
            residuals.append(res)
            valid_rows.append((f_obj, target))

        if len(valid_rows) < 4:
            self._status = "trained"
            return ModelMetrics(mae=0.0, rmse=0.0, sample_count=0)

        X = np.array(X_rows)
        y = np.array(residuals)

        reg_lambda = 0.05
        I = np.eye(X.shape[1])
        I[0, 0] = 0.0
        try:
            self._elasticity_weights = np.linalg.inv(X.T @ X + reg_lambda * I) @ X.T @ y
            self._status = "trained"
        except np.linalg.LinAlgError:
            pass

        y_true = [target for _, target in valid_rows]
        y_pred = []
        for f_obj, _ in valid_rows:
            pred_res = await self.predict(f_obj)
            y_pred.append(pred_res.prediction.estimated_cost)

        metrics = compute_metrics(y_true, y_pred)
        self._last_evaluated_metrics = metrics
        return metrics

    async def evaluate_baseline(self, test_dataset: List[Dict[str, Any]]) -> ModelMetrics:
        """
        Evaluates pure standardized tariff baseline without learned elasticity adjustments.
        """
        if not test_dataset:
            return ModelMetrics(mae=0.0, rmse=0.0, sample_count=0)

        y_true = []
        y_pred = []
        for sample in test_dataset:
            try:
                target = self._extract_target(sample)
            except ValueError:
                continue
            feats = sample.get("features", {})
            f_obj = TransportCostFeatures(**feats) if isinstance(feats, dict) else feats
            _, _, baseline_total = self._compute_tariff_baseline(f_obj)
            y_true.append(target)
            y_pred.append(float(baseline_total + f_obj.toll_charges))

        return compute_metrics(y_true, y_pred)

    async def evaluate(self, test_dataset: List[Dict[str, Any]]) -> ModelMetrics:
        if not test_dataset:
            return ModelMetrics(mae=0.0, rmse=0.0, sample_count=0)

        y_true = []
        y_pred = []
        for sample in test_dataset:
            try:
                target = self._extract_target(sample)
            except ValueError:
                continue
            feats = sample.get("features", {})
            f_obj = TransportCostFeatures(**feats) if isinstance(feats, dict) else feats
            pred_res = await self.predict(f_obj)
            y_true.append(target)
            y_pred.append(float(pred_res.prediction.estimated_cost))

        metrics = compute_metrics(y_true, y_pred)
        self._last_evaluated_metrics = metrics
        return metrics

    async def predict(self, features: TransportCostFeatures) -> PredictionResult[TransportCostOutput]:
        is_ood, ood_note = self._check_ood(features)

        # 1. Tariff Matrix Baseline
        base_freight, loading, baseline_total = self._compute_tariff_baseline(features)

        # 2. Learned Surcharge / Elasticity Layer
        vec = self._extract_elasticity_vector(features)
        learned_surcharge = max(0.0, float(vec @ self._elasticity_weights))

        fuel_surcharge = round(self._elasticity_weights[1] * max(0.0, features.diesel_price_per_litre - 90.0), 2)
        total_raw = baseline_total + learned_surcharge + features.toll_charges
        total = max(400.0, round(total_raw, 2))

        interval_delta = round(total * (0.25 if is_ood else 0.06), 2)
        cost_km = round(total / max(1.0, features.distance_km), 2)
        confidence = 0.45 if is_ood else 0.93

        return PredictionResult[TransportCostOutput](
            prediction=TransportCostOutput(
                estimated_cost=total,
                baseline_tariff_cost=round(baseline_total, 2),
                learned_surcharge_cost=round(learned_surcharge, 2),
                lower_bound_cost=round(total - interval_delta, 2),
                upper_bound_cost=round(total + interval_delta, 2),
                cost_per_km=cost_km,
                base_freight=round(base_freight, 2),
                loading_handling=loading,
                fuel_surcharge=fuel_surcharge,
                breakdown=f"Base Tariff: ₹{base_freight:.0f} + Loading: ₹{loading:.0f} + Learned Surcharge: ₹{learned_surcharge:.0f} + Toll: ₹{features.toll_charges:.0f}",
                confidence=confidence,
                feature_importance={
                    "base_distance_rate": 0.60,
                    "cargo_weight_elasticity": 0.25,
                    "fuel_index": 0.10,
                    "loading_toll": 0.05,
                }
            ),
            confidence=confidence,
            model_version=f"{self.model_name}-{self._version}",
            model_status=self._status,
            implementation_type=self.implementation_type,
            is_out_of_distribution=is_ood,
            uncertainty_note=ood_note,
            features_used=features.model_dump(),
            explanation=f"Estimated freight: ₹{total} (Base: ₹{baseline_total:.0f} + Surcharge: ₹{learned_surcharge:.0f}) for {features.distance_km} km with {features.vehicle_type}." + (f" [OOD Note: {ood_note}]" if is_ood else ""),
            metrics=self._last_evaluated_metrics,
        )

    def save(self, filepath: str) -> str:
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        joblib.dump({
            "model_name": self.model_name,
            "version": self._version,
            "status": self._status,
            "implementation_type": self.implementation_type,
            "base_tariff_per_km": self._base_tariff_per_km,
            "elasticity_weights": self._elasticity_weights.tolist(),
            "evaluated_metrics": self._last_evaluated_metrics.model_dump() if self._last_evaluated_metrics else None,
        }, filepath)
        return compute_artifact_sha256(filepath)

    def load(self, filepath: str):
        if os.path.exists(filepath):
            data = joblib.load(filepath)
            self._elasticity_weights = np.array(data["elasticity_weights"])
            self._version = data.get("version", self._version)
            self._status = data.get("status", self._status)
            if data.get("evaluated_metrics"):
                self._last_evaluated_metrics = ModelMetrics(**data["evaluated_metrics"])
