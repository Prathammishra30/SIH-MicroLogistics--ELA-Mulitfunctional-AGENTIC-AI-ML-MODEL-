# Provider-Agnostic LLM Abstraction (Phase 4 Python Core)
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List
from pydantic import BaseModel


class LLMResponse(BaseModel):
    text: str
    raw_output: Optional[Dict[str, Any]] = None
    provider_name: str
    tokens_used: int = 0
    latency_ms: float = 0.0


class StructuredLLMResponse(BaseModel):
    data: Dict[str, Any]
    provider_name: str
    confidence: float = 1.0


class LLMProvider(ABC):
    @property
    @abstractmethod
    def provider_name(self) -> str:
        pass

    @abstractmethod
    async def generate(self, prompt: str, system_prompt: Optional[str] = None, **kwargs) -> LLMResponse:
        """Generate unstructured text from prompt."""
        pass

    @abstractmethod
    async def structured_generate(
        self, prompt: str, schema: Dict[str, Any], system_prompt: Optional[str] = None, **kwargs
    ) -> StructuredLLMResponse:
        """Generate structured JSON conforming to schema."""
        pass

    @abstractmethod
    async def classify(self, text: str, candidate_labels: List[str], **kwargs) -> str:
        """Zero-shot classify text into candidate labels."""
        pass

    @abstractmethod
    async def extract_entities(self, text: str, entity_types: List[str], **kwargs) -> Dict[str, Any]:
        """Extract typed named entities from text."""
        pass


class CanonicalRuleLLMProvider(LLMProvider):
    """
    Deterministic rule-based reference provider for offline evaluation,
    testing, and benchmark reproducibility. Clearly identified as rule-based.
    """

    @property
    def provider_name(self) -> str:
        return "CanonicalRuleLLMProvider"

    async def generate(self, prompt: str, system_prompt: Optional[str] = None, **kwargs) -> LLMResponse:
        return LLMResponse(
            text=f"Processed response for: {prompt[:50]}...",
            provider_name=self.provider_name,
            tokens_used=len(prompt.split()),
            latency_ms=1.2,
        )

    async def structured_generate(
        self, prompt: str, schema: Dict[str, Any], system_prompt: Optional[str] = None, **kwargs
    ) -> StructuredLLMResponse:
        return StructuredLLMResponse(
            data={"message": "Structured output from canonical provider"},
            provider_name=self.provider_name,
            confidence=0.95,
        )

    async def classify(self, text: str, candidate_labels: List[str], **kwargs) -> str:
        norm = text.lower()
        for label in candidate_labels:
            if label.lower() in norm:
                return label
        return candidate_labels[0] if candidate_labels else "UNKNOWN"

    async def extract_entities(self, text: str, entity_types: List[str], **kwargs) -> Dict[str, Any]:
        return {}
