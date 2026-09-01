# Neural Network Models & Pattern Learning Engine (Phase 6 Universal Intelligence Fusion)
# Implements Real Multi-Layer Perceptrons, Feature Tensors, Forward/Backward Gradient Training,
# Model Serialization, Measurable Holdout Evaluation, and Version Governance.
import os
import json
import math
import numpy as np
from typing import List, Dict, Any, Optional, Tuple
from pydantic import BaseModel, Field
from datetime import datetime


class NeuralTensorMetadata(BaseModel):
    tensor_name: str
    shape: List[int]
    dtype: str = "float32"
    feature_names: List[str]
    normalized: bool = True


class NeuralFeatureTensor:
    """
    Standardized numerical tensor abstraction for neural learning and inference.
    """
    def __init__(self, data: np.ndarray, feature_names: Optional[List[str]] = None):
        self.data = np.asarray(data, dtype=np.float32)
        if self.data.ndim == 1:
            self.data = self.data.reshape(1, -1)
        self.feature_names = feature_names or [f"feat_{i}" for i in range(self.data.shape[1])]
        self.metadata = NeuralTensorMetadata(
            tensor_name="NeuralFeatureTensor",
            shape=list(self.data.shape),
            feature_names=self.feature_names,
            normalized=True,
        )

    def normalize(self) -> "NeuralFeatureTensor":
        mean = np.mean(self.data, axis=0, keepdims=True)
        std = np.std(self.data, axis=0, keepdims=True) + 1e-7
        norm_data = (self.data - mean) / std
        return NeuralFeatureTensor(norm_data, self.feature_names)

    def to_list(self) -> List[List[float]]:
        return self.data.tolist()


class NeuralEvaluationMetrics(BaseModel):
    loss: float
    mae: float
    rmse: float
    sample_count: int
    evaluated_at: str = Field(default_factory=lambda: datetime.now().isoformat())


class NeuralRouteDelayLearner:
    """
    Trainable Multi-Layer Perceptron (MLP: 6 -> 16 -> 8 -> 1) for Route Delay Learning.
    Supports real gradient-based training, holdout evaluation, weight serialization, and inference.
    """
    def __init__(self, version: str = "v1.0-neural-delay", learning_rate: float = 0.01):
        self.model_name = "NeuralRouteDelayLearner"
        self.version = version
        self.learning_rate = learning_rate
        self.status = "initialized"
        
        # Layer dimensions
        self.input_dim = 6
        self.hidden1_dim = 16
        self.hidden2_dim = 8
        self.output_dim = 1

        # He / Xavier weight initialization
        np.random.seed(42)
        self.W1 = np.random.randn(self.input_dim, self.hidden1_dim) * np.sqrt(2.0 / self.input_dim)
        self.b1 = np.zeros((1, self.hidden1_dim))
        
        self.W2 = np.random.randn(self.hidden1_dim, self.hidden2_dim) * np.sqrt(2.0 / self.hidden1_dim)
        self.b2 = np.zeros((1, self.hidden2_dim))
        
        self.W3 = np.random.randn(self.hidden2_dim, self.output_dim) * np.sqrt(2.0 / self.hidden2_dim)
        self.b3 = np.zeros((1, self.output_dim))

        self.last_metrics: Optional[NeuralEvaluationMetrics] = None

    def _relu(self, Z: np.ndarray) -> np.ndarray:
        return np.maximum(0.0, Z)

    def _relu_deriv(self, Z: np.ndarray) -> np.ndarray:
        return (Z > 0).astype(np.float32)

    def forward(self, X: np.ndarray) -> Tuple[np.ndarray, Dict[str, np.ndarray]]:
        Z1 = X @ self.W1 + self.b1
        A1 = self._relu(Z1)
        
        Z2 = A1 @ self.W2 + self.b2
        A2 = self._relu(Z2)
        
        Z3 = A2 @ self.W3 + self.b3
        # Output is expected delay in minutes
        A3 = np.maximum(0.0, Z3)
        
        cache = {"X": X, "Z1": Z1, "A1": A1, "Z2": Z2, "A2": A2, "Z3": Z3, "A3": A3}
        return A3, cache

    def train_step(self, X: np.ndarray, y: np.ndarray) -> float:
        m = X.shape[0]
        if m == 0:
            return 0.0

        # Forward
        preds, cache = self.forward(X)
        loss = float(np.mean((preds - y) ** 2))

        # Backward propagation
        dA3 = (2.0 / m) * (preds - y)
        dZ3 = dA3 * (cache["Z3"] > 0).astype(np.float32)
        dW3 = cache["A2"].T @ dZ3
        db3 = np.sum(dZ3, axis=0, keepdims=True)

        dA2 = dZ3 @ self.W3.T
        dZ2 = dA2 * self._relu_deriv(cache["Z1"] if "Z1" not in cache else cache["Z2"])
        dW2 = cache["A1"].T @ dZ2
        db2 = np.sum(dZ2, axis=0, keepdims=True)

        dA1 = dZ2 @ self.W2.T
        dZ1 = dA1 * self._relu_deriv(cache["Z1"])
        dW1 = cache["X"].T @ dZ1
        db1 = np.sum(dZ1, axis=0, keepdims=True)

        # Gradient update with clipping
        self.W3 -= self.learning_rate * np.clip(dW3, -5.0, 5.0)
        self.b3 -= self.learning_rate * np.clip(db3, -5.0, 5.0)
        self.W2 -= self.learning_rate * np.clip(dW2, -5.0, 5.0)
        self.b2 -= self.learning_rate * np.clip(db2, -5.0, 5.0)
        self.W1 -= self.learning_rate * np.clip(dW1, -5.0, 5.0)
        self.b1 -= self.learning_rate * np.clip(db1, -5.0, 5.0)

        return loss

    def fit(self, X: np.ndarray, y: np.ndarray, epochs: int = 50, batch_size: int = 16) -> NeuralEvaluationMetrics:
        m = X.shape[0]
        y = y.reshape(-1, 1) if y.ndim == 1 else y

        for epoch in range(epochs):
            indices = np.random.permutation(m)
            X_shuffled = X[indices]
            y_shuffled = y[indices]
            for start in range(0, m, batch_size):
                end = min(start + batch_size, m)
                self.train_step(X_shuffled[start:end], y_shuffled[start:end])

        self.status = "trained"
        self.last_metrics = self.evaluate(X, y)
        return self.last_metrics

    def predict(self, feature_tensor: NeuralFeatureTensor) -> float:
        preds, _ = self.forward(feature_tensor.data)
        return float(preds[0, 0])

    def evaluate(self, X: np.ndarray, y: np.ndarray) -> NeuralEvaluationMetrics:
        y = y.reshape(-1, 1) if y.ndim == 1 else y
        preds, _ = self.forward(X)
        errors = np.abs(preds - y)
        mae = float(np.mean(errors))
        rmse = float(np.sqrt(np.mean((preds - y) ** 2)))
        loss = float(np.mean((preds - y) ** 2))
        return NeuralEvaluationMetrics(
            loss=round(loss, 4),
            mae=round(mae, 2),
            rmse=round(rmse, 2),
            sample_count=X.shape[0],
        )

    def serialize_weights(self) -> Dict[str, Any]:
        return {
            "model_name": self.model_name,
            "version": self.version,
            "W1": self.W1.tolist(),
            "b1": self.b1.tolist(),
            "W2": self.W2.tolist(),
            "b2": self.b2.tolist(),
            "W3": self.W3.tolist(),
            "b3": self.b3.tolist(),
            "metrics": self.last_metrics.model_dump() if self.last_metrics else None,
        }

    def load_weights(self, data: Dict[str, Any]):
        self.version = data.get("version", self.version)
        self.W1 = np.array(data["W1"], dtype=np.float32)
        self.b1 = np.array(data["b1"], dtype=np.float32)
        self.W2 = np.array(data["W2"], dtype=np.float32)
        self.b2 = np.array(data["b2"], dtype=np.float32)
        self.W3 = np.array(data["W3"], dtype=np.float32)
        self.b3 = np.array(data["b3"], dtype=np.float32)
        self.status = "trained"


class NeuralTransporterReliabilityScorer:
    """
    Neural Multi-criteria Reliability Evaluator (4 -> 8 -> 1 with Sigmoid Activation).
    Inputs: [completion_rate, avg_punctuality_score, vehicle_maintenance_score, review_rating_norm]
    """
    def __init__(self, version: str = "v1.0-neural-reliability"):
        self.version = version
        np.random.seed(42)
        self.W1 = (np.abs(np.random.randn(4, 8)) * 0.4 + 0.2).astype(np.float32)
        self.b1 = np.zeros((1, 8), dtype=np.float32)
        self.W2 = (np.abs(np.random.randn(8, 1)) * 0.4 + 0.2).astype(np.float32)
        self.b2 = np.zeros((1, 1), dtype=np.float32)

    def _sigmoid(self, z: np.ndarray) -> np.ndarray:
        return 1.0 / (1.0 + np.exp(-np.clip(z, -10.0, 10.0)))

    def score_reliability(
        self,
        completion_rate: float = 0.98,
        punctuality_score: float = 0.92,
        maintenance_score: float = 0.90,
        rating: float = 4.8,
    ) -> float:
        norm_rating = min(1.0, rating / 5.0)
        X = np.array([[completion_rate, punctuality_score, maintenance_score, norm_rating]], dtype=np.float32)
        
        # Forward pass
        H1 = np.maximum(0.0, X @ self.W1 + self.b1)
        out = self._sigmoid(H1 @ self.W2 + self.b2)
        return float(round(float(out[0, 0]), 3))
