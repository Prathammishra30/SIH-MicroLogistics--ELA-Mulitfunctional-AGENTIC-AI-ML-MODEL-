# ELA Transformer Encoder Block (Phase 12.1)
import numpy as np
from typing import Optional, Tuple

from ai.ela.neural.transformer.attention import (
    NumpyMultiHeadSelfAttention,
)
from ai.ela.neural.transformer.feed_forward import (
    NumpyPositionwiseFeedForward,
)

try:
    import torch
    import torch.nn as nn
    from ai.ela.neural.transformer.attention import TorchMultiHeadSelfAttention
    from ai.ela.neural.transformer.feed_forward import TorchPositionwiseFeedForward
    HAS_TORCH = True
except ImportError:
    HAS_TORCH = False


if HAS_TORCH:
    class TorchTransformerBlock(nn.Module):
        """
        Complete Transformer Encoder Block:
        x -> Self-Attention -> Add & LayerNorm -> Feed-Forward -> Add & LayerNorm
        """
        def __init__(self, d_model: int, n_heads: int, d_ff: int, dropout: float = 0.1):
            super().__init__()
            self.attention = TorchMultiHeadSelfAttention(d_model=d_model, n_heads=n_heads, dropout=dropout)
            self.norm1 = nn.LayerNorm(d_model)
            self.norm2 = nn.LayerNorm(d_model)
            self.ffn = TorchPositionwiseFeedForward(d_model=d_model, d_ff=d_ff, dropout=dropout)
            self.dropout = nn.Dropout(dropout)

        def forward(
            self,
            x: torch.Tensor,
            attention_mask: Optional[torch.Tensor] = None,
        ) -> Tuple[torch.Tensor, torch.Tensor]:
            # Sub-layer 1: Self-Attention with residual connection & layer norm
            attn_out, attn_weights = self.attention(x, attention_mask=attention_mask)
            x = self.norm1(x + self.dropout(attn_out))

            # Sub-layer 2: Feed-Forward with residual connection & layer norm
            ffn_out = self.ffn(x)
            x = self.norm2(x + self.dropout(ffn_out))

            return x, attn_weights


class NumpyTransformerBlock:
    """NumPy tensor reference implementation of Transformer Encoder Block."""
    def __init__(self, d_model: int, n_heads: int, d_ff: int, seed: int = 42):
        self.d_model = d_model
        self.attention = NumpyMultiHeadSelfAttention(d_model=d_model, n_heads=n_heads, seed=seed)
        self.ffn = NumpyPositionwiseFeedForward(d_model=d_model, d_ff=d_ff, seed=seed + 1)
        self.gamma1 = np.ones(d_model, dtype=np.float32)
        self.beta1 = np.zeros(d_model, dtype=np.float32)
        self.gamma2 = np.ones(d_model, dtype=np.float32)
        self.beta2 = np.zeros(d_model, dtype=np.float32)
        self.eps = 1e-5

    def _layer_norm(self, x: np.ndarray, gamma: np.ndarray, beta: np.ndarray) -> np.ndarray:
        mean = np.mean(x, axis=-1, keepdims=True)
        variance = np.var(x, axis=-1, keepdims=True)
        norm_x = (x - mean) / np.sqrt(variance + self.eps)
        return norm_x * gamma + beta

    def forward(
        self,
        x: np.ndarray,
        attention_mask: Optional[np.ndarray] = None,
    ) -> Tuple[np.ndarray, np.ndarray]:
        attn_out, attn_weights = self.attention.forward(x, attention_mask=attention_mask)
        x = self._layer_norm(x + attn_out, self.gamma1, self.beta1)
        ffn_out = self.ffn.forward(x)
        x = self._layer_norm(x + ffn_out, self.gamma2, self.beta2)
        return x, attn_weights
