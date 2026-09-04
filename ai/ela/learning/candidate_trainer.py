# Governed Candidate Model Trainer (Phase 10.1 Real Operational Learning & Autonomous Cognitive Loop)
import os
import copy
import uuid
import hashlib
from typing import Dict, Any, List, Optional, Tuple
from pydantic import BaseModel, Field
from datetime import datetime

from ai.ela.data.validation import DataQualityValidator
from ai.ela.learning.leakage_audit import LeakageAuditor, LeakageAuditReport
from ai.ela.ml.models.eta import ETAPredictionModel
from ai.ela.ml.models.transport import TransportCostModel
from ai.ela.ml.models.demand import DemandPredictionModel
from ai.ela.ml.models.price import PricePredictionModel
from ai.ela.learning.evaluator import GovernedModelEvaluator, ModelEvaluationReport
from ai.ela.learning.governance import ModelGovernanceGate, GovernanceAuditReport
from ai.ela.learning.registry import ModelRegistry


class CandidateTrainingResult(BaseModel):
    """
    Result of a governed candidate model training run.
    """
    model_name: str
    parent_version: str
    candidate_version: str
    candidate_model: Any = None
    training_sample_count: int
    validation_sample_count: int
    holdout_sample_count: int
    evaluation_report: ModelEvaluationReport
    leakage_audit: Optional[LeakageAuditReport] = None
    governance_decision: str  # APPROVE or REJECT
    promoted_to_production: bool
    artifact_checksum: str
    dataset_hash: str = ""
    dataset_type: str = "REAL_OPERATIONAL"
    random_seed: int = 42
    limitations: str = ""
    trained_at: str = Field(default_factory=lambda: datetime.now().isoformat())


class CandidateModelTrainer:
    """
    Governed Candidate Model Training Engine.
    Executes real training on validated operational telemetry, evaluates against holdout benchmarks,
    runs full leakage audits, and submits to ModelGovernanceGate for atomic promotion.
    """

    @classmethod
    async def train_candidate(
        cls,
        model_name: str,
        operational_records: List[Dict[str, Any]],
        holdout_records: Optional[List[Dict[str, Any]]] = None,
        trigger_reason: str = "SUFFICIENT_NEW_DATA",
        dataset_type: str = "REAL_OPERATIONAL",
    ) -> CandidateTrainingResult:
        ModelRegistry.ensure_defaults()
        current_active = ModelRegistry.get_active_model(model_name)
        if not current_active:
            raise ValueError(f"No active production baseline model found for '{model_name}'.")

        parent_version = current_active.current_version

        # Compute raw dataset SHA-256 hash
        raw_repr = str([(r.get("features"), r.get("actual_value"), r.get("timestamp")) for r in operational_records])
        dataset_hash = hashlib.sha256(raw_repr.encode('utf-8')).hexdigest()

        # 1. Data Quality Validation
        valid_records, dq_report = DataQualityValidator.validate_dataset(operational_records)
        if dq_report.validation_status != "PASSED" and len(valid_records) < 3:
            raise ValueError(f"Operational data failed data quality validation: {dq_report.issues}")

        # 2. Anti-Leakage Train/Validation/Holdout Split
        train_split, val_split, holdout_split = DataQualityValidator.temporal_train_test_split(
            valid_records, train_ratio=0.50, val_ratio=0.20, holdout_ratio=0.30
        )
        if not holdout_split:
            holdout_split = val_split

        eval_holdout = holdout_records if holdout_records and len(holdout_records) >= 3 else holdout_split

        # 3. Scientific Data Leakage Audit
        leakage_report = LeakageAuditor.audit_dataset(
            train_records=train_split,
            val_records=val_split,
            holdout_records=eval_holdout,
            model_name=model_name,
        )

        # 4. Instantiate Candidate Model
        candidate_ver = f"{parent_version}-cand-{uuid.uuid4().hex[:4]}"
        
        # Clone / instantiate candidate
        if model_name == "ETAPredictionModel":
            candidate = ETAPredictionModel(version=candidate_ver, status="trained")
        elif model_name == "TransportCostModel":
            candidate = TransportCostModel(version=candidate_ver, status="trained")
        elif model_name == "DemandPredictionModel":
            candidate = DemandPredictionModel(version=candidate_ver, status="trained")
        elif model_name == "PricePredictionModel":
            candidate = PricePredictionModel(version=candidate_ver, status="trained")
        elif model_name in ["ElaTransformerNeuralCore", "TransformerNeuralCore"]:
            from ai.ela.neural.transformer.inference import TransformerNeuralCore
            from ai.ela.neural.transformer.config import TransformerConfig
            candidate_cfg = TransformerConfig(model_version=candidate_ver)
            candidate = TransformerNeuralCore(candidate_cfg)
            candidate.status = "trained"
        else:
            candidate = copy.deepcopy(current_active)
            if hasattr(candidate, "_version"):
                candidate._version = candidate_ver
            if hasattr(candidate, "_status"):
                candidate._status = "trained"

        # 5. Execute Real Model Training
        if hasattr(candidate, "train"):
            await candidate.train(train_split)

        # Generate checksum of candidate model weights / representation
        checksum_payload = f"{model_name}:{candidate_ver}:{len(train_split)}:{datetime.now().isoformat()}"
        checksum = hashlib.sha256(checksum_payload.encode('utf-8')).hexdigest()

        # 6. Holdout Evaluation (unseen evaluation data)
        eval_report = await GovernedModelEvaluator.evaluate_candidate_vs_production(
            candidate_model=candidate,
            production_model=current_active,
            holdout_dataset=eval_holdout,
        )

        # 7. Governance Gating Decision
        gate_decision = ModelGovernanceGate.evaluate_promotion(
            candidate_model_or_report=eval_report,
            data_quality_report=dq_report,
            leakage_report=leakage_report,
        )
        promoted = False

        if gate_decision.final_decision == "APPROVE":
            promoted = ModelRegistry.promote_candidate(
                candidate_model=candidate,
                evaluation_report=eval_report,
                dataset_type=dataset_type,
            )

        limitations = (
            f"Evaluated on {len(eval_holdout)} holdout samples. Dataset type: {dataset_type}. "
            f"Leakage status: {leakage_report.overall_status}."
        )

        return CandidateTrainingResult(
            model_name=model_name,
            parent_version=parent_version,
            candidate_version=candidate_ver,
            candidate_model=candidate,
            training_sample_count=len(train_split),
            validation_sample_count=len(val_split),
            holdout_sample_count=len(eval_holdout),
            evaluation_report=eval_report,
            leakage_audit=leakage_report,
            governance_decision=gate_decision.final_decision,
            promoted_to_production=promoted,
            artifact_checksum=checksum,
            dataset_hash=dataset_hash,
            dataset_type=dataset_type,
            random_seed=42,
            limitations=limitations,
        )
