# Machine Learning Types and Interfaces (Phase 5B.1 Authenticity Core)
from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional, Generic, TypeVar, Literal
from pydantic import BaseModel, Field
from datetime import datetime

ModelStatus = Literal['demo', 'baseline', 'candidate', 'trained', 'evaluated', 'approved', 'production', 'retired']
ModelImplementationType = Literal[
    'RULE_BASED',
    'MATHEMATICAL_BASELINE',
    'STATISTICAL_MODEL',
    'TRAINED_MACHINE_LEARNING_MODEL',
    'HYBRID_MODEL',
    'MULTI_OBJECTIVE_DECISION_MODEL',
]
DatasetType = Literal['REAL', 'SYNTHETIC', 'GENERATED', 'OPERATIONAL']

TInput = TypeVar('TInput')
TOutput = TypeVar('TOutput')


class ModelMetrics(BaseModel):
    mae: float = 0.0
    rmse: float = 0.0
    r_squared: Optional[float] = None
    mape: Optional[float] = None
    sample_count: int = 0
    evaluated_at: str = Field(default_factory=lambda: datetime.now().isoformat())


class ModelArtifactMetadata(BaseModel):
    model_name: str
    model_version: str
    implementation_type: ModelImplementationType
    algorithm: str
    dataset_type: DatasetType
    dataset_version: str
    training_sample_count: int
    validation_metrics: ModelMetrics
    test_metrics: ModelMetrics
    feature_schema: List[str]
    ood_support_ranges: Dict[str, Dict[str, float]] = Field(default_factory=dict)
    artifact_hash: str
    status: ModelStatus
    training_timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())


class PredictionResult(BaseModel, Generic[TOutput]):
    prediction: TOutput
    confidence: float  # Evidence-calibrated uncertainty score (0.0 - 1.0)
    model_version: str
    model_status: ModelStatus
    implementation_type: ModelImplementationType
    is_out_of_distribution: bool = False
    uncertainty_note: Optional[str] = None
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())
    features_used: Dict[str, Any]
    explanation: str
    metrics: Optional[ModelMetrics] = None


class IMLModel(ABC, Generic[TInput, TOutput]):
    @property
    @abstractmethod
    def model_name(self) -> str:
        pass

    @property
    @abstractmethod
    def current_version(self) -> str:
        pass

    @property
    @abstractmethod
    def implementation_type(self) -> ModelImplementationType:
        pass

    @property
    @abstractmethod
    def status(self) -> ModelStatus:
        pass

    @abstractmethod
    async def train(self, dataset: List[Dict[str, Any]]) -> ModelMetrics:
        """Train model parameters on dataset and return validation metrics."""
        pass

    @abstractmethod
    async def predict(self, features: TInput) -> PredictionResult[TOutput]:
        """Perform predictive inference with uncertainty & OOD checks."""
        pass

    @abstractmethod
    async def evaluate(self, test_dataset: List[Dict[str, Any]]) -> ModelMetrics:
        """Evaluate model against test dataset."""
        pass

    @abstractmethod
    def save(self, filepath: str) -> str:
        """Persist model artifact and return sha256 checksum."""
        pass

    @abstractmethod
    def load(self, filepath: str):
        """Load model artifact from disk."""
        pass
