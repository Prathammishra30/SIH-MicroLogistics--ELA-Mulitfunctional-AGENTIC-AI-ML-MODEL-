# Reusable Domain Adapter Interface (Phase 5 Core Intelligence Fusion)
# Decouples ELA Core Intelligence from specific deployment applications/domains.
from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional, Tuple
from pydantic import BaseModel


class DomainContext(BaseModel):
    domain_id: str
    domain_name: str
    supported_roles: List[str]
    supported_intents: List[str]
    primary_entities: List[str]


class DomainAdapter(ABC):
    @property
    @abstractmethod
    def context(self) -> DomainContext:
        """Domain configuration and metadata."""
        pass

    @abstractmethod
    def validate_entities(self, entities: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """Validates domain-specific entity boundaries."""
        pass

    @abstractmethod
    def get_system_prompt_rules(self, role: str, language: str) -> str:
        """Injects domain behavioral principles and safety boundaries."""
        pass
