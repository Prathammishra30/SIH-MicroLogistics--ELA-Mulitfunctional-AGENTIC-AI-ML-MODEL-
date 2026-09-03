# ELA Transformer Task Heads (Phase 12.1)
import numpy as np
from typing import Dict, Any, Optional, Tuple

try:
    import torch
    import torch.nn as nn
    HAS_TORCH = True
except ImportError:
    HAS_TORCH = False


if HAS_TORCH:
    class TorchIntentClassificationHead(nn.Module):
        """Intent prediction head over pooled contextual representation."""
        def __init__(self, d_model: int, num_intents: int = 16, dropout: float = 0.1):
            super().__init__()
            self.dropout = nn.Dropout(dropout)
            self.classifier = nn.Linear(d_model, num_intents)

        def forward(self, pooled_features: torch.Tensor) -> torch.Tensor:
            return self.classifier(self.dropout(pooled_features))

    class TorchDecisionScoringHead(nn.Module):
        """Decision context readiness & complexity scoring head."""
        def __init__(self, d_model: int, hidden_dim: int = 32, dropout: float = 0.1):
            super().__init__()
            self.net = nn.Sequential(
                nn.Dropout(dropout),
                nn.Linear(d_model, hidden_dim),
                nn.GELU(),
                nn.Linear(hidden_dim, 1),
                nn.Sigmoid(),
            )

        def forward(self, pooled_features: torch.Tensor) -> torch.Tensor:
            return self.net(pooled_features)


class NumpyIntentClassificationHead:
    """NumPy reference implementation of Intent Classification Head."""
    def __init__(self, d_model: int, num_intents: int = 16, seed: int = 42):
        rng = np.random.RandomState(seed)
        self.W = rng.randn(d_model, num_intents).astype(np.float32) * (1.0 / np.sqrt(d_model))
        self.b = np.zeros(num_intents, dtype=np.float32)

    def forward(self, pooled: np.ndarray) -> np.ndarray:
        return np.matmul(pooled, self.W) + self.b


class NumpyDecisionScoringHead:
    """NumPy reference implementation of Decision Scoring Head."""
    def __init__(self, d_model: int, hidden_dim: int = 32, seed: int = 43):
        rng = np.random.RandomState(seed)
        self.W1 = rng.randn(d_model, hidden_dim).astype(np.float32) * (1.0 / np.sqrt(d_model))
        self.b1 = np.zeros(hidden_dim, dtype=np.float32)
        self.W2 = rng.randn(hidden_dim, 1).astype(np.float32) * (1.0 / np.sqrt(hidden_dim))
        self.b2 = np.zeros(1, dtype=np.float32)

    def forward(self, pooled: np.ndarray) -> np.ndarray:
        h = np.maximum(0, np.matmul(pooled, self.W1) + self.b1)  # ReLU
        logits = np.matmul(h, self.W2) + self.b2
        return 1.0 / (1.0 + np.exp(-np.clip(logits, -15.0, 15.0)))  # Sigmoid
