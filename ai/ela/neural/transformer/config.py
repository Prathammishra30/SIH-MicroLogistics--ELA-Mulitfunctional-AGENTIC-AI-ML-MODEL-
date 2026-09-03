# ELA Transformer Neural Core Configuration (Phase 12.1)
from dataclasses import dataclass
from typing import Dict, Any, Optional


@dataclass
class TransformerConfig:
    """
    Measurable, explicit configuration for the ELA Transformer Neural Subsystem.
    Configured for local efficiency, high throughput, and deterministic reproducibility.
    """
    vocab_size: int = 256
    d_model: int = 64
    n_heads: int = 4
    num_layers: int = 2
    d_ff: int = 128
    max_seq_len: int = 32
    dropout: float = 0.1
    num_intents: int = 16
    model_version: str = "v1.0-transformer-core"
    architecture_version: str = "ela-transformer-v1"
    device: str = "cpu"
    seed: int = 42

    def __post_init__(self):
        if self.d_model % self.n_heads != 0:
            raise ValueError(f"d_model ({self.d_model}) must be divisible by n_heads ({self.n_heads})")

    @property
    def head_dim(self) -> int:
        return self.d_model // self.n_heads

    def to_dict(self) -> Dict[str, Any]:
        return {
            "vocab_size": self.vocab_size,
            "d_model": self.d_model,
            "n_heads": self.n_heads,
            "num_layers": self.num_layers,
            "d_ff": self.d_ff,
            "max_seq_len": self.max_seq_len,
            "dropout": self.dropout,
            "num_intents": self.num_intents,
            "model_version": self.model_version,
            "architecture_version": self.architecture_version,
            "device": self.device,
            "seed": self.seed,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "TransformerConfig":
        return cls(**{k: v for k, v in data.items() if k in cls.__dataclass_fields__})
