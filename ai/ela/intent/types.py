# Canonical Intent Definitions & Data Structures (Phase 4 Python Core)
from typing import Optional
from pydantic import BaseModel
from ai.ela.agent.state import ElaIntent, UserRole, SupportedLanguage, CanonicalEntities


class CanonicalIntent(BaseModel):
    intent: ElaIntent
    target_role: UserRole
    language: SupportedLanguage
    entities: CanonicalEntities
    raw_text: str
    confidence: float = 0.85
