# ML Mathematical Evaluation & Artifact Utilities
import hashlib
import json
import numpy as np
from typing import List, Dict, Any, Tuple
from ai.ela.ml.types import ModelMetrics


def compute_metrics(y_true: List[float], y_pred: List[float]) -> ModelMetrics:
    """
    Computes genuine mathematical metrics directly from ground-truth and predicted vectors.
    Zero hardcoded values.
    """
    if not y_true or not y_pred or len(y_true) != len(y_pred):
        return ModelMetrics(mae=0.0, rmse=0.0, r_squared=0.0, sample_count=0)

    y_t = np.array(y_true, dtype=float)
    y_p = np.array(y_pred, dtype=float)

    errors = np.abs(y_t - y_p)
    mae = float(np.mean(errors))
    rmse = float(np.sqrt(np.mean((y_t - y_p) ** 2)))

    ss_tot = float(np.sum((y_t - np.mean(y_t)) ** 2))
    ss_res = float(np.sum((y_t - y_p) ** 2))
    r_squared = float(1.0 - (ss_res / max(1e-8, ss_tot))) if len(y_t) > 1 and ss_tot > 1e-6 else 0.0

    # Mean Absolute Percentage Error (avoid division by zero)
    non_zero = y_t > 1e-4
    mape = float(np.mean(errors[non_zero] / y_t[non_zero]) * 100.0) if np.any(non_zero) else None

    return ModelMetrics(
        mae=round(mae, 2),
        rmse=round(rmse, 2),
        r_squared=round(max(-1.0, min(1.0, r_squared)), 3),
        mape=round(mape, 2) if mape is not None else None,
        sample_count=len(y_true),
    )


def compute_artifact_sha256(filepath: str) -> str:
    """Computes SHA-256 checksum of saved artifact file."""
    hasher = hashlib.sha256()
    with open(filepath, 'rb') as f:
        while chunk := f.read(8192):
            hasher.update(chunk)
    return hasher.hexdigest()
