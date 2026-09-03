# ELA Transformer Evaluation & Operational Metrics (Phase 12.1)
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field
from datetime import datetime


class TransformerMetrics(BaseModel):
    """
    Measurable metrics for the ELA Transformer Neural Core.
    """
    loss: float = 0.0
    intent_loss: float = 0.0
    decision_loss: float = 0.0
    intent_accuracy: float = 0.0
    decision_mae: float = 0.0
    decision_rmse: float = 0.0
    mean_attention_entropy: float = 0.0
    sample_count: int = 0
    parameter_count: int = 0
    inference_latency_ms: float = 0.0
    evaluated_at: str = Field(default_factory=lambda: datetime.now().isoformat())

    def to_dict(self) -> Dict[str, Any]:
        return self.model_dump()
