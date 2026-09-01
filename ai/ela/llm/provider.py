# LLM Provider Forwarding & Compatibility Layer (Phase 6 Universal Intelligence Fusion)
from ai.ela.providers.llm import (
    LLMMessage,
    LLMResponse,
    StructuredLLMResponse,
    LLMProvider,
    ProductionLLMAdapter,
    CanonicalRuleLLMProvider,
)

# Backwards compatibility aliases
MockLLMProvider = CanonicalRuleLLMProvider
GeminiLLMProvider = ProductionLLMAdapter
