# ELA Transformer Position-wise Feed-Forward Network (Phase 12.1)
import math
import numpy as np
from typing import Optional

try:
    import torch
    import torch.nn as nn
    import torch.nn.functional as F
    HAS_TORCH = True
except ImportError:
    HAS_TORCH = False


def gelu_numpy(x: np.ndarray) -> np.ndarray:
    """Exact GELU approximation."""
    return 0.5 * x * (1.0 + np.tanh(math.sqrt(2.0 / math.pi) * (x + 0.044715 * np.power(x, 3))))


if HAS_TORCH:
    class TorchPositionwiseFeedForward(nn.Module):
        """
        Two-stage linear expansion network with GELU non-linearity:
        FFN(x) = GELU(x W_1 + b_1) W_2 + b_2
        """
        def __init__(self, d_model: int, d_ff: int, dropout: float = 0.1):
            super().__init__()
            self.linear1 = nn.Linear(d_model, d_ff)
            self.linear2 = nn.Linear(d_ff, d_model)
            self.dropout = nn.Dropout(dropout)
            self.act = nn.GELU()

        def forward(self, x: torch.Tensor) -> torch.Tensor:
            return self.linear2(self.dropout(self.act(self.linear1(x))))


class NumpyPositionwiseFeedForward:
    """NumPy tensor reference implementation of Feed-Forward network."""
    def __init__(self, d_model: int, d_ff: int, seed: int = 42):
        rng = np.random.RandomState(seed)
        std1 = math.sqrt(2.0 / d_model)
        std2 = math.sqrt(2.0 / d_ff)
        self.W1 = rng.randn(d_model, d_ff).astype(np.float32) * std1
        self.b1 = np.zeros(d_ff, dtype=np.float32)
        self.W2 = rng.randn(d_ff, d_model).astype(np.float32) * std2
        self.b2 = np.zeros(d_model, dtype=np.float32)

    def forward(self, x: np.ndarray) -> np.ndarray:
        hidden = gelu_numpy(np.matmul(x, self.W1) + self.b1)
        return np.matmul(hidden, self.W2) + self.b2
