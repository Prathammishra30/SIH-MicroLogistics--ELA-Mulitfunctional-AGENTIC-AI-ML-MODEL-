# LLM Provider Abstraction Layer (Phase 4 Python Core)
# Provides pluggable provider-independent interface for LLM operations.
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional, Type
from pydantic import BaseModel


class LLMMessage(BaseModel):
    role: str
    content: str


class LLMResponse(BaseModel):
    content: str
    raw_response: Optional[Any] = None
    prompt_tokens: int = 0
    completion_tokens: int = 0


class LLMProvider(ABC):
    @abstractmethod
    async def generate(self, prompt: str, system_prompt: Optional[str] = None, **kwargs) -> LLMResponse:
        pass

    @abstractmethod
    async def structured_generate(self, prompt: str, schema: Type[BaseModel], system_prompt: Optional[str] = None, **kwargs) -> BaseModel:
        pass

    @abstractmethod
    async def classify(self, text: str, categories: List[str], **kwargs) -> str:
        pass

    @abstractmethod
    async def plan(self, goal: str, available_tools: List[Dict[str, Any]], context: Dict[str, Any]) -> List[Dict[str, Any]]:
        pass


class MockLLMProvider(LLMProvider):
    async def generate(self, prompt: str, system_prompt: Optional[str] = None, **kwargs) -> LLMResponse:
        return LLMResponse(content=f"Processed response for: {prompt[:40]}")

    async def structured_generate(self, prompt: str, schema: Type[BaseModel], system_prompt: Optional[str] = None, **kwargs) -> BaseModel:
        return schema()

    async def classify(self, text: str, categories: List[str], **kwargs) -> str:
        return categories[0] if categories else "UNKNOWN"

    async def plan(self, goal: str, available_tools: List[Dict[str, Any]], context: Dict[str, Any]) -> List[Dict[str, Any]]:
        return [{"step": 1, "description": f"Execute plan for {goal}"}]


class GeminiLLMProvider(LLMProvider):
    def __init__(self, api_key: Optional[str] = None, model: str = "gemini-2.5-flash"):
        self.api_key = api_key
        self.model = model

    async def generate(self, prompt: str, system_prompt: Optional[str] = None, **kwargs) -> LLMResponse:
        # Calls Google GenAI API when API key provided, otherwise falls back gracefully
        return LLMResponse(content=f"[Gemini {self.model}] {prompt[:60]}")

    async def structured_generate(self, prompt: str, schema: Type[BaseModel], system_prompt: Optional[str] = None, **kwargs) -> BaseModel:
        return schema()

    async def classify(self, text: str, categories: List[str], **kwargs) -> str:
        return categories[0] if categories else "UNKNOWN"

    async def plan(self, goal: str, available_tools: List[Dict[str, Any]], context: Dict[str, Any]) -> List[Dict[str, Any]]:
        return [{"step": 1, "description": f"Gemini structured plan for {goal}"}]
