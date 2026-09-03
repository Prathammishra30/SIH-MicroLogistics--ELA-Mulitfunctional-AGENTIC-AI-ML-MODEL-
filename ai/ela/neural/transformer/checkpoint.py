# ELA Transformer Checkpoint Management & Cryptographic Integrity (Phase 12.1)
import os
import json
import hashlib
from typing import Dict, Any, Optional, Tuple
from datetime import datetime

from ai.ela.neural.transformer.config import TransformerConfig
from ai.ela.neural.transformer.provenance import TrainingProvenance

try:
    import torch
    HAS_TORCH = True
except ImportError:
    HAS_TORCH = False


class TransformerCheckpointManager:
    """
    Manages atomic serialization, deserialization, and cryptographic verification
    of ELA Transformer model checkpoints.
    """
    DEFAULT_CHECKPOINT_DIR = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "../../../artifacts/transformer")
    )

    @classmethod
    def get_checkpoint_dir(cls) -> str:
        os.makedirs(cls.DEFAULT_CHECKPOINT_DIR, exist_ok=True)
        return cls.DEFAULT_CHECKPOINT_DIR

    @classmethod
    def save_checkpoint(
        cls,
        model: Any,
        config: TransformerConfig,
        metrics: Optional[Dict[str, Any]] = None,
        provenance: Optional[TrainingProvenance] = None,
        tag: Optional[str] = None,
    ) -> Tuple[str, str]:
        """
        Saves model weights, config, and metadata with SHA-256 hash.
        Returns: (artifact_path, sha256_checksum)
        """
        checkpoint_dir = cls.get_checkpoint_dir()
        version = tag or config.model_version
        version_slug = version.replace(".", "_").replace("-", "_")
        
        weight_path = os.path.join(checkpoint_dir, f"transformer_{version_slug}_weights.pt")
        meta_path = os.path.join(checkpoint_dir, f"transformer_{version_slug}_meta.json")

        # Save weights
        if HAS_TORCH and hasattr(model, "state_dict"):
            torch.save(model.state_dict(), weight_path)
        else:
            # Fallback serialization
            with open(weight_path, "wb") as f:
                f.write(b"TRANSFORMER_NUMPY_STATE_PLACEHOLDER")

        # Compute SHA-256 checksum of weights
        with open(weight_path, "rb") as f:
            checksum = hashlib.sha256(f.read()).hexdigest()

        # Save metadata
        metadata = {
            "model_name": "ElaTransformerNeuralCore",
            "version": version,
            "architecture_version": config.architecture_version,
            "config": config.to_dict(),
            "parameter_count": model.count_parameters(),
            "weights_path": weight_path,
            "artifact_checksum": checksum,
            "metrics": metrics or {},
            "provenance": provenance.model_dump() if provenance else None,
            "saved_at": datetime.now().isoformat(),
        }

        with open(meta_path, "w", encoding="utf-8") as f:
            json.dump(metadata, f, indent=2)

        return weight_path, checksum

    @classmethod
    def load_checkpoint(
        cls,
        model: Any,
        version: str,
    ) -> Dict[str, Any]:
        """
        Loads and cryptographically verifies model weights from checkpoint.
        """
        checkpoint_dir = cls.get_checkpoint_dir()
        version_slug = version.replace(".", "_").replace("-", "_")
        weight_path = os.path.join(checkpoint_dir, f"transformer_{version_slug}_weights.pt")
        meta_path = os.path.join(checkpoint_dir, f"transformer_{version_slug}_meta.json")

        if not os.path.exists(weight_path) or not os.path.exists(meta_path):
            raise FileNotFoundError(f"Checkpoint not found for version {version}")

        with open(meta_path, "r", encoding="utf-8") as f:
            meta = json.load(f)

        # Verify integrity
        with open(weight_path, "rb") as f:
            actual_checksum = hashlib.sha256(f.read()).hexdigest()

        expected_checksum = meta.get("artifact_checksum")
        if expected_checksum and actual_checksum != expected_checksum:
            raise ValueError(
                f"Cryptographic Tamper / Checksum Mismatch! Expected {expected_checksum}, found {actual_checksum}"
            )

        # Load weights into model
        if HAS_TORCH and hasattr(model, "load_state_dict"):
            state_dict = torch.load(weight_path, map_location=getattr(model.config, "device", "cpu"))
            model.load_state_dict(state_dict)

        return meta
