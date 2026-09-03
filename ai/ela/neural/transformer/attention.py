# ELA Transformer Multi-Head Self-Attention (Phase 12.1)
import math
import numpy as np
from typing import Dict, Any, Optional, Tuple

try:
    import torch
    import torch.nn as nn
    import torch.nn.functional as F
    HAS_TORCH = True
except ImportError:
    HAS_TORCH = False


def compute_attention_entropy_numpy(attn_weights: np.ndarray) -> float:
    """Computes mean Shannon entropy of attention weights across heads and sequence."""
    eps = 1e-9
    entropy = -np.sum(attn_weights * np.log(attn_weights + eps), axis=-1)
    return float(np.mean(entropy))


if HAS_TORCH:
    class TorchMultiHeadSelfAttention(nn.Module):
        """
        Genuine Multi-Head Self Attention module.
        Implements Query, Key, Value projections, scaled dot-product attention,
        attention masking, head concatenation, output projection, and entropy diagnostics.
        """
        def __init__(self, d_model: int, n_heads: int, dropout: float = 0.1):
            super().__init__()
            if d_model % n_heads != 0:
                raise ValueError(f"d_model {d_model} must be divisible by n_heads {n_heads}")

            self.d_model = d_model
            self.n_heads = n_heads
            self.head_dim = d_model // n_heads

            self.q_proj = nn.Linear(d_model, d_model)
            self.k_proj = nn.Linear(d_model, d_model)
            self.v_proj = nn.Linear(d_model, d_model)
            self.out_proj = nn.Linear(d_model, d_model)

            self.dropout = nn.Dropout(dropout)
            self.scale = 1.0 / math.sqrt(self.head_dim)

        def forward(
            self,
            x: torch.Tensor,
            attention_mask: Optional[torch.Tensor] = None,
        ) -> Tuple[torch.Tensor, torch.Tensor]:
            """
            Args:
                x: Input tensor of shape (batch_size, seq_len, d_model)
                attention_mask: Optional mask of shape (batch_size, seq_len) with 1 for valid, 0 for pad
            Returns:
                output: Contextual tensor of shape (batch_size, seq_len, d_model)
                attn_weights: Attention matrix of shape (batch_size, n_heads, seq_len, seq_len)
            """
            batch_size, seq_len, _ = x.size()

            # 1. Project Q, K, V
            q = self.q_proj(x)
            k = self.k_proj(x)
            v = self.v_proj(x)

            # 2. Reshape to (batch_size, n_heads, seq_len, head_dim)
            q = q.view(batch_size, seq_len, self.n_heads, self.head_dim).transpose(1, 2)
            k = k.view(batch_size, seq_len, self.n_heads, self.head_dim).transpose(1, 2)
            v = v.view(batch_size, seq_len, self.n_heads, self.head_dim).transpose(1, 2)

            # 3. Scaled dot-product scores: (batch_size, n_heads, seq_len, seq_len)
            scores = torch.matmul(q, k.transpose(-2, -1)) * self.scale

            # 4. Apply attention mask if provided
            if attention_mask is not None:
                # attention_mask shape: (batch_size, seq_len) -> (batch_size, 1, 1, seq_len)
                mask = attention_mask.unsqueeze(1).unsqueeze(2)
                scores = scores.masked_fill(mask == 0, -1e9)

            # 5. Softmax attention weights
            attn_weights = F.softmax(scores, dim=-1)
            attn_dropped = self.dropout(attn_weights)

            # 6. Compute context output: (batch_size, n_heads, seq_len, head_dim)
            context = torch.matmul(attn_dropped, v)

            # 7. Concatenate heads: (batch_size, seq_len, d_model)
            context = context.transpose(1, 2).contiguous().view(batch_size, seq_len, self.d_model)

            # 8. Final linear projection
            output = self.out_proj(context)

            return output, attn_weights


class NumpyMultiHeadSelfAttention:
    """
    Exact NumPy tensor reference implementation of Multi-Head Self-Attention.
    """
    def __init__(self, d_model: int, n_heads: int, seed: int = 42):
        if d_model % n_heads != 0:
            raise ValueError(f"d_model {d_model} must be divisible by n_heads {n_heads}")
        self.d_model = d_model
        self.n_heads = n_heads
        self.head_dim = d_model // n_heads
        self.scale = 1.0 / math.sqrt(self.head_dim)

        # Initialize weights
        rng = np.random.RandomState(seed)
        std = math.sqrt(2.0 / d_model)
        self.W_q = rng.randn(d_model, d_model).astype(np.float32) * std
        self.b_q = np.zeros(d_model, dtype=np.float32)
        self.W_k = rng.randn(d_model, d_model).astype(np.float32) * std
        self.b_k = np.zeros(d_model, dtype=np.float32)
        self.W_v = rng.randn(d_model, d_model).astype(np.float32) * std
        self.b_v = np.zeros(d_model, dtype=np.float32)
        self.W_o = rng.randn(d_model, d_model).astype(np.float32) * std
        self.b_o = np.zeros(d_model, dtype=np.float32)

    def forward(
        self,
        x: np.ndarray,
        attention_mask: Optional[np.ndarray] = None,
    ) -> Tuple[np.ndarray, np.ndarray]:
        batch_size, seq_len, _ = x.shape

        q = np.matmul(x, self.W_q) + self.b_q
        k = np.matmul(x, self.W_k) + self.b_k
        v = np.matmul(x, self.W_v) + self.b_v

        # Reshape to (batch_size, n_heads, seq_len, head_dim)
        q = q.reshape(batch_size, seq_len, self.n_heads, self.head_dim).transpose(0, 2, 1, 3)
        k = k.reshape(batch_size, seq_len, self.n_heads, self.head_dim).transpose(0, 2, 1, 3)
        v = v.reshape(batch_size, seq_len, self.n_heads, self.head_dim).transpose(0, 2, 1, 3)

        # Scaled dot-product
        scores = np.matmul(q, k.transpose(0, 1, 3, 2)) * self.scale

        if attention_mask is not None:
            mask = attention_mask[:, np.newaxis, np.newaxis, :]
            scores = np.where(mask == 0, -1e9, scores)

        # Numerically stable softmax
        exp_scores = np.exp(scores - np.max(scores, axis=-1, keepdims=True))
        attn_weights = exp_scores / (np.sum(exp_scores, axis=-1, keepdims=True) + 1e-9)

        context = np.matmul(attn_weights, v)
        context = context.transpose(0, 2, 1, 3).reshape(batch_size, seq_len, self.d_model)

        output = np.matmul(context, self.W_o) + self.b_o
        return output, attn_weights
