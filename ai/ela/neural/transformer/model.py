# ELA Transformer Core Architecture (Phase 12.1)
import math
import hashlib
import numpy as np
from typing import Dict, Any, Optional, Tuple, List
from pydantic import BaseModel, Field
from datetime import datetime

from ai.ela.neural.transformer.config import TransformerConfig
from ai.ela.neural.transformer.positional_encoding import (
    SinusoidalPositionalEncoding,
)
from ai.ela.neural.transformer.block import (
    NumpyTransformerBlock,
)
from ai.ela.neural.transformer.heads import (
    NumpyIntentClassificationHead,
    NumpyDecisionScoringHead,
)
from ai.ela.neural.transformer.attention import compute_attention_entropy_numpy

try:
    import torch
    import torch.nn as nn
    from ai.ela.neural.transformer.embeddings import TorchTokenEmbedding
    from ai.ela.neural.transformer.positional_encoding import TorchPositionalEncoding
    from ai.ela.neural.transformer.block import TorchTransformerBlock
    from ai.ela.neural.transformer.heads import (
        TorchIntentClassificationHead,
        TorchDecisionScoringHead,
    )
    HAS_TORCH = True
except ImportError:
    HAS_TORCH = False


class ElaTransformerState(BaseModel):
    """
    Contextual representation produced by the ELA Transformer Neural Core.
    """
    hidden_state_summary: List[float]  # First 8 dimensions of pooled representation
    pooled_representation: List[float]  # Full d_model vector
    attention_summary: Dict[str, Any]
    intent_logits: List[float]
    predicted_intent_index: int
    decision_score: float  # Neural contextual readiness in [0.0, 1.0]
    model_version: str
    model_checksum: str
    parameter_count: int
    inference_latency_ms: float
    status: str = "COMPUTED"  # COMPUTED, FALLBACK, UNAVAILABLE
    inference_metadata: Dict[str, Any] = Field(default_factory=dict)


if HAS_TORCH:
    class TorchElaTransformerModel(nn.Module):
        """
        PyTorch Implementation of the ELA Transformer Neural Core.
        Stacked multi-head self-attention encoder with task heads.
        """
        def __init__(self, config: TransformerConfig):
            super().__init__()
            self.config = config

            # Token Embedding + Positional Encoding
            self.token_embedding = TorchTokenEmbedding(config.vocab_size, config.d_model)
            self.pos_encoding = TorchPositionalEncoding(config.d_model, config.max_seq_len, config.dropout)

            # Stacked Transformer Blocks
            self.blocks = nn.ModuleList([
                TorchTransformerBlock(
                    d_model=config.d_model,
                    n_heads=config.n_heads,
                    d_ff=config.d_ff,
                    dropout=config.dropout,
                )
                for _ in range(config.num_layers)
            ])

            # Final Normalization
            self.norm = nn.LayerNorm(config.d_model)

            # Task Heads
            self.intent_head = TorchIntentClassificationHead(
                d_model=config.d_model,
                num_intents=config.num_intents,
                dropout=config.dropout,
            )
            self.decision_head = TorchDecisionScoringHead(
                d_model=config.d_model,
                hidden_dim=32,
                dropout=config.dropout,
            )

        def count_parameters(self) -> int:
            return sum(p.numel() for p in self.parameters() if p.requires_grad)

        def forward(
            self,
            token_ids: torch.Tensor,
            attention_mask: Optional[torch.Tensor] = None,
        ) -> Tuple[torch.Tensor, torch.Tensor, torch.Tensor, List[torch.Tensor]]:
            """
            Args:
                token_ids: Tensor of shape (batch_size, seq_len)
                attention_mask: Tensor of shape (batch_size, seq_len)
            Returns:
                intent_logits: (batch_size, num_intents)
                decision_score: (batch_size, 1)
                pooled_rep: (batch_size, d_model)
                all_attentions: List of attention tensors per block
            """
            # Embeddings + Positional
            x = self.token_embedding(token_ids)
            x = self.pos_encoding(x)

            all_attentions = []
            for block in self.blocks:
                x, attn = block(x, attention_mask=attention_mask)
                all_attentions.append(attn)

            x = self.norm(x)

            # CLS token pooled representation (index 0)
            pooled_rep = x[:, 0, :]

            # Task heads
            intent_logits = self.intent_head(pooled_rep)
            decision_score = self.decision_head(pooled_rep)

            return intent_logits, decision_score, pooled_rep, all_attentions
else:
    class TorchElaTransformerModel:  # type: ignore
        """
        PyTorch Implementation of the ELA Transformer Neural Core (Fallback Stub when PyTorch is not installed).
        """
        def __init__(self, config: Optional[TransformerConfig] = None):
            raise ImportError(
                "TorchElaTransformerModel requires PyTorch, but 'torch' is not installed in this Python environment. "
                "Please run with the project virtual environment (.\\.venv\\Scripts\\python.exe) "
                "or utilize NumpyElaTransformerModel for mathematically equivalent CPU inference."
            )



class NumpyElaTransformerModel:
    """
    NumPy mathematical reference implementation of the ELA Transformer Core.
    Guarantees mathematical correctness without third-party frameworks if needed.
    """
    def __init__(self, config: TransformerConfig):
        self.config = config
        rng = np.random.RandomState(config.seed)

        # Embedding matrix
        self.embedding_table = rng.randn(config.vocab_size, config.d_model).astype(np.float32) * (1.0 / math.sqrt(config.d_model))
        self.embedding_table[0, :] = 0.0  # PAD token is zero

        # Positional Encoding
        self.pos_helper = SinusoidalPositionalEncoding(config.d_model, config.max_seq_len)

        # Blocks
        self.blocks = [
            NumpyTransformerBlock(config.d_model, config.n_heads, config.d_ff, seed=config.seed + i * 10)
            for i in range(config.num_layers)
        ]

        # Final LayerNorm
        self.gamma = np.ones(config.d_model, dtype=np.float32)
        self.beta = np.zeros(config.d_model, dtype=np.float32)

        # Task Heads
        self.intent_head = NumpyIntentClassificationHead(config.d_model, config.num_intents, seed=config.seed + 99)
        self.decision_head = NumpyDecisionScoringHead(config.d_model, 32, seed=config.seed + 100)

    def count_parameters(self) -> int:
        # Measurable analytical parameter count
        vocab_params = self.config.vocab_size * self.config.d_model
        per_block = (
            3 * (self.config.d_model * self.config.d_model + self.config.d_model) # Q, K, V
            + (self.config.d_model * self.config.d_model + self.config.d_model) # O
            + 2 * self.config.d_model # norm1
            + (self.config.d_model * self.config.d_ff + self.config.d_ff) # W1, b1
            + (self.config.d_ff * self.config.d_model + self.config.d_model) # W2, b2
            + 2 * self.config.d_model # norm2
        )
        total_blocks = per_block * self.config.num_layers
        final_norm = 2 * self.config.d_model
        intent_head = self.config.d_model * self.config.num_intents + self.config.num_intents
        decision_head = self.config.d_model * 32 + 32 + 32 * 1 + 1
        return vocab_params + total_blocks + final_norm + intent_head + decision_head

    def forward(
        self,
        token_ids: np.ndarray,
        attention_mask: Optional[np.ndarray] = None,
    ) -> Tuple[np.ndarray, np.ndarray, np.ndarray, List[np.ndarray]]:
        batch_size, seq_len = token_ids.shape

        # Lookup embeddings
        x = self.embedding_table[token_ids] * math.sqrt(self.config.d_model)

        # Add positional encoding
        pe = self.pos_helper.get_encoding_numpy(seq_len)
        x = x + pe

        all_attentions = []
        for block in self.blocks:
            x, attn = block.forward(x, attention_mask=attention_mask)
            all_attentions.append(attn)

        # Final LayerNorm
        mean = np.mean(x, axis=-1, keepdims=True)
        var = np.var(x, axis=-1, keepdims=True)
        x = ((x - mean) / np.sqrt(var + 1e-5)) * self.gamma + self.beta

        # CLS pooled representation
        pooled_rep = x[:, 0, :]

        # Heads
        intent_logits = self.intent_head.forward(pooled_rep)
        decision_score = self.decision_head.forward(pooled_rep)

        return intent_logits, decision_score, pooled_rep, all_attentions
 
 
__all__ = [
    "ElaTransformerState",
    "TorchElaTransformerModel",
    "NumpyElaTransformerModel",
]
