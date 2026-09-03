# ELA Transformer Data Provenance & Training Lineage (Phase 12.1)
from typing import Dict, Any, List, Literal, Optional
from pydantic import BaseModel, Field
from datetime import datetime


DatasetProvenanceType = Literal["REAL_OPERATIONAL", "SYNTHETIC_TEST", "HYBRID_BENCHMARK"]


class TrainingProvenance(BaseModel):
    """
    Immutable lineage record for Transformer training sessions.
    Strictly records whether data was real operational telemetry or synthetic testing data.
    """
    provenance_id: str = Field(default_factory=lambda: f"prov-{int(datetime.now().timestamp() * 1000)}")
    dataset_id: str
    dataset_provenance: DatasetProvenanceType
    sample_count: int
    train_samples: int
    val_samples: int
    holdout_samples: int = 0
    feature_version: str = "v1.0-transformer-features"
    preprocessing_version: str = "v1.0-standard-vectorizer"
    model_version: str
    random_seed: int
    training_config: Dict[str, Any] = Field(default_factory=dict)
    evaluation_metrics: Dict[str, Any] = Field(default_factory=dict)
    audit_passed: bool = True
    audit_findings: List[str] = Field(default_factory=list)
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())

    def assert_valid(self):
        """Ensures that synthetic benchmark data is never masqueraded as real operational telemetry."""
        if "synthetic" in self.dataset_id.lower() and self.dataset_provenance == "REAL_OPERATIONAL":
            raise ValueError("Data Provenance Violation: Synthetic dataset cannot be claimed as REAL_OPERATIONAL.")
