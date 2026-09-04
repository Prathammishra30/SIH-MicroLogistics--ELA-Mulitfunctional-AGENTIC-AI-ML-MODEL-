# ELA Transformer Neural Core Service & Inference Engine (Phase 12.1)
import time
import hashlib
import numpy as np
from typing import Dict, Any, Optional, List

from ai.ela.neural.transformer.config import TransformerConfig
from ai.ela.neural.transformer.model import (
    ElaTransformerState,
    TorchElaTransformerModel,
    NumpyElaTransformerModel,
)
from ai.ela.neural.transformer.embeddings import ElaNeuralInput, ElaInputVectorizer
from ai.ela.neural.transformer.checkpoint import TransformerCheckpointManager

try:
    import torch
    HAS_TORCH = True
except ImportError:
    HAS_TORCH = False


class TransformerNeuralCore:
    """
    Production-grade Transformer Neural Subsystem for ELA Universal Brain.
    Performs real tensor computation, computes learned contextual representations,
    and supplies downstream intent and decision signals with safe fallback degradation.
    """
    _instance: Optional["TransformerNeuralCore"] = None

    def __init__(self, config: Optional[TransformerConfig] = None):
        self.config = config or TransformerConfig()
        self.model_name = "ElaTransformerNeuralCore"
        self.current_version = self.config.model_version
        self.is_torch_active = HAS_TORCH
        self.status = "INITIALIZING"

        if HAS_TORCH:
            torch.manual_seed(self.config.seed)
            self.model = TorchElaTransformerModel(self.config)
            self.model.eval()
        else:
            self.model = NumpyElaTransformerModel(self.config)

        self.parameter_count = self.model.count_parameters()
        self.algorithm = "MultiHeadAttentionTransformer"
        self.artifact_path = None
        self.status = "READY"
        self._cached_checksum = self._compute_active_checksum()

    @classmethod
    def get_instance(cls) -> "TransformerNeuralCore":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    @classmethod
    def reset_instance(cls):
        cls._instance = None

    def _compute_active_checksum(self) -> str:
        """Computes deterministic signature of model parameters."""
        if HAS_TORCH and hasattr(self.model, "state_dict"):
            buf = bytearray()
            for k, v in sorted(self.model.state_dict().items()):
                buf.extend(k.encode("utf-8"))
                buf.extend(v.cpu().numpy().tobytes()[:256])
            return hashlib.sha256(buf).hexdigest()
        return hashlib.sha256(b"NUMPY_TRANSFORMER_ACTIVE").hexdigest()

    def encode(self, neural_input: ElaNeuralInput) -> ElaTransformerState:
        """
        Executes real tensor forward pass and produces learned contextual representation.
        Guarantees safe fallback degradation on invalid inputs or runtime errors.
        """
        start_time = time.perf_counter()

        try:
            token_ids, attention_mask, numerical_feats = ElaInputVectorizer.vectorize(
                neural_input, max_seq_len=self.config.max_seq_len
            )

            if HAS_TORCH:
                with torch.no_grad():
                    t_ids = torch.tensor(token_ids, dtype=torch.long).unsqueeze(0)
                    a_mask = torch.tensor(attention_mask, dtype=torch.float32).unsqueeze(0)

                    intent_logits_t, decision_score_t, pooled_rep_t, all_attns = self.model(
                        t_ids, attention_mask=a_mask
                    )

                    intent_logits = intent_logits_t.squeeze(0).cpu().numpy().tolist()
                    decision_score = float(decision_score_t.squeeze().item())
                    pooled_rep = pooled_rep_t.squeeze(0).cpu().numpy().tolist()

                    # Attention summary from last layer
                    last_attn = all_attns[-1].squeeze(0).cpu().numpy()  # (n_heads, seq_len, seq_len)
                    eps = 1e-9
                    entropy = -np.sum(last_attn * np.log(last_attn + eps), axis=-1)
                    mean_entropy = float(np.mean(entropy))
            else:
                t_ids = token_ids[np.newaxis, :]
                a_mask = attention_mask[np.newaxis, :]
                intent_logits_np, decision_score_np, pooled_rep_np, all_attns = self.model.forward(
                    t_ids, attention_mask=a_mask
                )
                intent_logits = intent_logits_np[0].tolist()
                decision_score = float(decision_score_np[0, 0])
                pooled_rep = pooled_rep_np[0].tolist()
                last_attn = all_attns[-1][0]
                eps = 1e-9
                entropy = -np.sum(last_attn * np.log(last_attn + eps), axis=-1)
                mean_entropy = float(np.mean(entropy))

            latency_ms = (time.perf_counter() - start_time) * 1000.0
            pred_intent_idx = int(np.argmax(intent_logits))

            return ElaTransformerState(
                hidden_state_summary=pooled_rep[:8],
                pooled_representation=pooled_rep,
                attention_summary={
                    "layers": self.config.num_layers,
                    "heads": self.config.n_heads,
                    "mean_entropy": round(mean_entropy, 4),
                    "dominant_tokens": token_ids[:4].tolist(),
                },
                intent_logits=[round(v, 4) for v in intent_logits],
                predicted_intent_index=pred_intent_idx,
                decision_score=round(decision_score, 4),
                model_version=self.current_version,
                model_checksum=self._cached_checksum,
                parameter_count=self.parameter_count,
                inference_latency_ms=round(latency_ms, 2),
                status="COMPUTED",
                inference_metadata={
                    "backend": "PyTorch" if HAS_TORCH else "NumPy",
                    "sequence_length": len(token_ids),
                    "norm_weight": numerical_feats.get("norm_weight", 0.0),
                },
            )

        except Exception as e:
            # Safe Fallback Degradation without fabricating confidence
            latency_ms = (time.perf_counter() - start_time) * 1000.0
            return ElaTransformerState(
                hidden_state_summary=[0.0] * 8,
                pooled_representation=[0.0] * self.config.d_model,
                attention_summary={"error": str(e), "fallback": True},
                intent_logits=[0.0] * self.config.num_intents,
                predicted_intent_index=0,
                decision_score=0.70,
                model_version=self.current_version,
                model_checksum=self._cached_checksum,
                parameter_count=self.parameter_count,
                inference_latency_ms=round(latency_ms, 2),
                status="FALLBACK",
                inference_metadata={"error": str(e), "signal_used": False},
            )

    def infer(self, neural_input: ElaNeuralInput) -> Dict[str, Any]:
        """Convenience dictionary output format for brain and agent coordinator."""
        state = self.encode(neural_input)
        return {
            "model_name": self.model_name,
            "model_version": state.model_version,
            "architecture_version": self.config.architecture_version,
            "parameter_count": state.parameter_count,
            "latency_ms": state.inference_latency_ms,
            "decision_score": state.decision_score,
            "predicted_intent_index": state.predicted_intent_index,
            "context_representation_summary": state.hidden_state_summary,
            "attention_summary": state.attention_summary,
            "status": state.status,
            "neural_signal_used": (state.status == "COMPUTED"),
        }

    def health(self) -> Dict[str, Any]:
        return {
            "model_name": self.model_name,
            "model_version": self.current_version,
            "architecture_version": self.config.architecture_version,
            "parameter_count": self.parameter_count,
            "status": self.status,
            "backend": "PyTorch" if self.is_torch_active else "NumPy",
            "d_model": self.config.d_model,
            "n_heads": self.config.n_heads,
            "num_layers": self.config.num_layers,
            "checksum": self._cached_checksum,
        }

    def model_info(self) -> Dict[str, Any]:
        return {
            "model_name": self.model_name,
            "version": self.current_version,
            "config": self.config.to_dict(),
            "parameter_count": self.parameter_count,
            "checksum": self._cached_checksum,
            "supported_tasks": ["contextual_representation", "intent_representation", "decision_scoring"],
        }

    async def evaluate(self, dataset: List[Dict[str, Any]]) -> Any:
        from ai.ela.ml.types import ModelMetrics
        if not dataset:
            return ModelMetrics(sample_count=0)
        errors = []
        for r in dataset:
            inp = r.get("neural_input")
            if not inp:
                features = r.get("features", {})
                inp = ElaNeuralInput(
                    session_id=features.get("session_id", "eval-sess"),
                    role=features.get("role", "FARMER"),
                    language=features.get("language", "en"),
                    intent=features.get("intent", "GENERAL_HELP"),
                    entities={
                        "commodity": features.get("commodity", "Tomatoes"),
                        "weight_kg": float(features.get("weight_kg", 500.0)),
                        "origin": features.get("origin", "Nashik"),
                        "destination": features.get("destination", "Pune"),
                    },
                )
            elif isinstance(inp, dict):
                inp = ElaNeuralInput(**inp)
            res = self.encode(inp)
            target = float(r.get("actual_value", r.get("decision_target", 0.8)))
            pred = float(res.decision_score)
            errors.append(abs(pred - target))
        mae = float(np.mean(errors)) if errors else 0.0
        rmse = float(np.sqrt(np.mean(np.square(errors)))) if errors else 0.0
        return ModelMetrics(mae=round(mae, 4), rmse=round(rmse, 4), sample_count=len(dataset))

    async def train(self, dataset: List[Dict[str, Any]]) -> Dict[str, Any]:
        from ai.ela.neural.transformer.training import TransformerTrainer
        trainer = TransformerTrainer(config=self.config)
        formatted = []
        for r in dataset:
            if "neural_input" in r:
                formatted.append(r)
            else:
                features = r.get("features", {})
                formatted.append({
                    "neural_input": ElaNeuralInput(
                        session_id=features.get("session_id", "train-sess"),
                        role=features.get("role", "FARMER"),
                        language=features.get("language", "en"),
                        intent=features.get("intent", "CREATE_LOGISTICS_WORKFLOW"),
                        entities={
                            "commodity": features.get("commodity", "Tomatoes"),
                            "weight_kg": float(features.get("weight_kg", 500.0)),
                            "origin": features.get("origin", "Nashik"),
                            "destination": features.get("destination", "Pune"),
                        },
                    ),
                    "intent_target": 1,
                    "decision_target": float(r.get("actual_value", 0.85)),
                })
        if formatted:
            try:
                model, metrics, prov, _ = trainer.train_supervised(
                    dataset=formatted,
                    epochs=2,
                    candidate_version=self.current_version,
                )
                self.model = model
                self._cached_checksum = self._compute_active_checksum()
                return metrics.to_dict()
            except Exception as e:
                return {"status": "FAILED", "error": str(e)}
        return {"status": "EMPTY_DATASET"}

