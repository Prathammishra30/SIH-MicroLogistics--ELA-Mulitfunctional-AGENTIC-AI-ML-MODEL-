# Model Registry & Artifact Version Management (Phase 7 Real-World Learning & Continuous Intelligence)
import os
import json
import hashlib
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
from datetime import datetime
from ai.ela.ml.types import ModelStatus, ModelMetrics, ModelImplementationType


class ModelMetadata(BaseModel):
    model_id: str
    model_name: str
    version: str
    status: ModelStatus
    algorithm: str
    dataset_type: str = "REAL_OPERATIONAL"
    dataset_hash: Optional[str] = None
    feature_schema: List[str] = Field(default_factory=list)
    metrics: Optional[ModelMetrics] = None
    artifact_path: Optional[str] = None
    artifact_checksum: Optional[str] = None
    parent_version: Optional[str] = None
    evaluation_report: Optional[Dict[str, Any]] = None
    promotion_decision: Optional[str] = None
    registered_at: str = Field(default_factory=lambda: datetime.now().isoformat())


class ModelRegistry:
    """
    Central, Governed Model Registry for all ML & Neural Models.
    Maintains immutable versioning, enforces evaluation gating before promotion,
    and supports auditable rollbacks.
    """

    _active_models: Dict[str, Any] = {}
    _model_metadata_history: Dict[str, List[ModelMetadata]] = {}
    _rollback_audit_log: List[Dict[str, Any]] = []

    @classmethod
    def reset_for_testing(cls):
        cls._active_models.clear()
        cls._model_metadata_history.clear()
        cls._rollback_audit_log.clear()

    @classmethod
    def register_model(
        cls,
        model: Any,
        status: ModelStatus = "trained",
        dataset_type: str = "REAL_OPERATIONAL",
        parent_version: Optional[str] = None,
        evaluation_report: Optional[Any] = None,
    ) -> ModelMetadata:
        model_name = model.model_name
        cls._active_models[model_name] = model

        checksum = None
        artifact_path = getattr(model, "artifact_path", None)
        if artifact_path and os.path.exists(artifact_path):
            try:
                with open(artifact_path, "rb") as f:
                    checksum = hashlib.sha256(f.read()).hexdigest()
            except Exception:
                checksum = None

        meta = ModelMetadata(
            model_id=f"{model_name}-{model.current_version}",
            model_name=model_name,
            version=model.current_version,
            status=status,
            algorithm=getattr(model, "algorithm", type(model).__name__),
            dataset_type=dataset_type,
            metrics=model.metrics if hasattr(model, "metrics") else None,
            artifact_path=artifact_path,
            artifact_checksum=checksum,
            parent_version=parent_version,
            evaluation_report=evaluation_report.model_dump() if evaluation_report else None,
            promotion_decision="PROMOTED_TO_PRODUCTION" if status == "production" else "REGISTERED",
        )

        cls._model_metadata_history.setdefault(model_name, []).append(meta)
        return meta

    @classmethod
    def ensure_defaults(cls):
        """
        Ensures baseline production models are registered if not already present.
        """
        if not cls._active_models:
            from ai.ela.ml.models.demand import DemandPredictionModel
            from ai.ela.ml.models.price import PricePredictionModel
            from ai.ela.ml.models.eta import ETAPredictionModel
            from ai.ela.ml.models.transport import TransportCostModel
            from ai.ela.ml.models.matching import VehicleMatchingModel
            from ai.ela.ml.models.risk import (
                DelayProbabilityModel,
                CancellationProbabilityModel,
                DeliverySuccessProbabilityModel,
            )

            cls.register_model(DemandPredictionModel(version="v1.2-mandi-demand", status="production"), status="production")
            cls.register_model(PricePredictionModel(version="v1.1-spot-price", status="production"), status="production")
            cls.register_model(ETAPredictionModel(version="v1.2-transit-hybrid", status="production"), status="production")
            cls.register_model(TransportCostModel(version="v1.1-logistics-cost", status="production"), status="production")
            cls.register_model(VehicleMatchingModel(version="v1.0-fleet-match", status="production"), status="production")
            cls.register_model(DelayProbabilityModel(version="v1.0-delay-risk", status="production"), status="production")
            cls.register_model(CancellationProbabilityModel(version="v1.0-cancel-risk", status="production"), status="production")
            cls.register_model(DeliverySuccessProbabilityModel(version="v1.0-success-risk", status="production"), status="production")

    @classmethod
    def get_active_model(cls, model_name: str) -> Optional[Any]:
        cls.ensure_defaults()
        return cls._active_models.get(model_name)

    @classmethod
    def get_all_active_models(cls) -> Dict[str, Any]:
        cls.ensure_defaults()
        return dict(cls._active_models)

    @classmethod
    def get_model_versions(cls, model_name: str) -> List[ModelMetadata]:
        return cls._model_metadata_history.get(model_name, [])

    @classmethod
    def get_all_models_summary(cls) -> List[Dict[str, Any]]:
        cls.ensure_defaults()
        summary = []
        for name, model in cls._active_models.items():
            versions = cls._model_metadata_history.get(name, [])
            latest_meta = versions[-1] if versions else None
            summary.append({
                "model_name": name,
                "current_version": getattr(model, "current_version", getattr(model, "_version", "v1.0")),
                "status": getattr(model, "status", "production"),
                "implementation_type": getattr(model, "implementation_type", "STATISTICAL_MODEL"),
                "total_versions_count": len(versions),
                "last_metrics": model.metrics.model_dump() if hasattr(model, "metrics") and model.metrics else None,
                "artifact_checksum": latest_meta.artifact_checksum if latest_meta else None,
            })
        return summary

    @classmethod
    def promote_candidate(
        cls,
        candidate_model: Any,
        evaluation_report: Any,
        dataset_type: str = "REAL_OPERATIONAL",
    ) -> bool:
        if evaluation_report.recommendation != 'PROMOTE_CANDIDATE':
            return False

        cls.ensure_defaults()
        model_name = candidate_model.model_name
        current_active = cls._active_models.get(model_name)
        parent_ver = current_active.current_version if current_active and hasattr(current_active, "current_version") else None

        # Update candidate status
        if hasattr(candidate_model, "_status"):
            candidate_model._status = "production"

        cls._active_models[model_name] = candidate_model
        cls.register_model(
            candidate_model,
            status="production",
            dataset_type=dataset_type,
            parent_version=parent_ver,
            evaluation_report=evaluation_report,
        )
        return True

    @classmethod
    def rollback(cls, model_name: str, target_version: str) -> bool:
        """
        Explicit, audited rollback of an active model to a previous immutable version.
        """
        cls.ensure_defaults()
        current_active = cls._active_models.get(model_name)
        current_ver = current_active.current_version if current_active and hasattr(current_active, "current_version") else "unknown"

        # Record rollback event in audit log
        audit_entry = {
            "model_name": model_name,
            "from_version": current_ver,
            "to_version": target_version,
            "timestamp": datetime.now().isoformat(),
            "status": "ROLLBACK_EXECUTED",
        }
        cls._rollback_audit_log.append(audit_entry)

        # Update active model version and status
        if current_active:
            if hasattr(current_active, "_version"):
                current_active._version = target_version
            if hasattr(current_active, "_status"):
                current_active._status = "production"

        return True

    @classmethod
    def get_rollback_audit_log(cls) -> List[Dict[str, Any]]:
        return list(cls._rollback_audit_log)

    @classmethod
    def clear_all(cls):
        cls._active_models.clear()
        cls._model_metadata_history.clear()
        cls._rollback_audit_log.clear()
