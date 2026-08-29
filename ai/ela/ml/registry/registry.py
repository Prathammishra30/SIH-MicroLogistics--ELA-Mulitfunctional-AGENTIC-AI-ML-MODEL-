# Model Registry and Lifecycle Store (Phase 4 Python Core)
from typing import Dict, Any, Optional, List
from ai.ela.ml.types import IMLModel, ModelStatus


class ModelRegistry:
    """
    Central registry tracking registered ML models, active production versions, and governance stages.
    """
    def __init__(self):
        self._models: Dict[str, IMLModel] = {}

    def register_model(self, model_name: str, model_instance: IMLModel):
        self._models[model_name] = model_instance

    def get_model(self, model_name: str) -> Optional[IMLModel]:
        return self._models.get(model_name)

    def list_models(self) -> List[Dict[str, Any]]:
        return [
            {
                "model_name": name,
                "version": m.current_version,
                "status": m.status,
            }
            for name, m in self._models.items()
        ]
