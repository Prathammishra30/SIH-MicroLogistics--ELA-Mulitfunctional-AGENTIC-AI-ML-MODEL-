# ELA Transformer Positional Encoding (Phase 12.1)
import math
import numpy as np
from typing import Optional

try:
    import torch
    import torch.nn as nn
    HAS_TORCH = True
except ImportError:
    HAS_TORCH = False


class SinusoidalPositionalEncoding:
    """
    Standard Sinusoidal Positional Encoding for sequence representations.
    Provides mathematically exact sinusoidal positional tables for sequences up to max_len.
    """
    def __init__(self, d_model: int, max_len: int = 512):
        self.d_model = d_model
        self.max_len = max_len
        
        # Compute the positional encodings once in log space
        pe = np.zeros((max_len, d_model), dtype=np.float32)
        position = np.arange(0, max_len, dtype=np.float32)[:, np.newaxis]
        div_term = np.exp(np.arange(0, d_model, 2, dtype=np.float32) * -(math.log(10000.0) / d_model))
        
        pe[:, 0::2] = np.sin(position * div_term)
        pe[:, 1::2] = np.cos(position * div_term)
        self.pe_numpy = pe[np.newaxis, :, :]  # Shape: (1, max_len, d_model)

    def get_encoding_numpy(self, seq_len: int) -> np.ndarray:
        if seq_len > self.max_len:
            raise ValueError(f"Sequence length {seq_len} exceeds maximum length {self.max_len}")
        return self.pe_numpy[:, :seq_len, :]

    def get_encoding_torch(self, seq_len: int, device: Optional[str] = "cpu"):
        if not HAS_TORCH:
            raise RuntimeError("PyTorch is required for get_encoding_torch")
        enc = torch.from_numpy(self.get_encoding_numpy(seq_len)).to(device)
        return enc


if HAS_TORCH:
    class TorchPositionalEncoding(nn.Module):
        def __init__(self, d_model: int, max_len: int = 512, dropout: float = 0.1):
            super().__init__()
            self.dropout = nn.Dropout(p=dropout)
            pe_helper = SinusoidalPositionalEncoding(d_model=d_model, max_len=max_len)
            pe_tensor = torch.from_numpy(pe_helper.pe_numpy)  # (1, max_len, d_model)
            self.register_buffer("pe", pe_tensor)

        def forward(self, x: torch.Tensor) -> torch.Tensor:
            # x shape: (batch_size, seq_len, d_model)
            seq_len = x.size(1)
            x = x + self.pe[:, :seq_len, :]
            return self.dropout(x)
