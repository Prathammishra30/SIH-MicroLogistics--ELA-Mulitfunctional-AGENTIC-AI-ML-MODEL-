# ELA Memory Layer: Session, Multi-Turn, and User Preferences (Phase 4 Python Core)
from typing import Dict, Any, Optional, List
from datetime import datetime
from ai.ela.agent.state import CanonicalEntities, GoalPlan, ElaIntent, SupportedLanguage


class ConversationSession:
    def __init__(self, session_id: str):
        self.session_id = session_id
        self.turns: List[Dict[str, Any]] = []
        self.accumulated_entities: CanonicalEntities = CanonicalEntities()
        self.last_intent: Optional[ElaIntent] = None
        self.active_goal: Optional[GoalPlan] = None
        self.created_at = datetime.now().isoformat()
        self.updated_at = datetime.now().isoformat()

    @property
    def entities(self) -> CanonicalEntities:
        return self.accumulated_entities


class ConversationMemory:
    _sessions: Dict[str, ConversationSession] = {}

    @classmethod
    def get_session(cls, session_id: str) -> ConversationSession:
        if session_id not in cls._sessions:
            cls._sessions[session_id] = ConversationSession(session_id)
        return cls._sessions[session_id]

    @classmethod
    def add_turn(cls, session_id: str, role: str, content: str):
        sess = cls.get_session(session_id)
        sess.turns.append({
            'role': role,
            'content': content,
            'timestamp': datetime.now().isoformat(),
        })
        sess.updated_at = datetime.now().isoformat()

    @classmethod
    def update_entities(cls, session_id: str, new_entities: CanonicalEntities) -> CanonicalEntities:
        sess = cls.get_session(session_id)
        # Merge new non-null entities into accumulated session state
        for field, val in new_entities.model_dump(exclude_none=True).items():
            if field == "strategy":
                if val != "BALANCED" or getattr(sess.accumulated_entities, "strategy", "BALANCED") == "BALANCED":
                    setattr(sess.accumulated_entities, field, val)
            else:
                setattr(sess.accumulated_entities, field, val)
        sess.updated_at = datetime.now().isoformat()
        return sess.accumulated_entities

    @classmethod
    def set_last_intent(cls, session_id: str, intent: ElaIntent):
        sess = cls.get_session(session_id)
        sess.last_intent = intent

    @classmethod
    def set_active_goal(cls, session_id: str, goal: GoalPlan):
        sess = cls.get_session(session_id)
        sess.active_goal = goal


class UserMemory:
    _user_preferences: Dict[str, Dict[str, Any]] = {}

    @classmethod
    def get_preferences(cls, user_id: str) -> Dict[str, Any]:
        return cls._user_preferences.get(user_id, {
            'preferred_language': 'en',
            'frequent_crops': [],
            'preferred_mandi': 'Pune APMC Mandi',
        })

    @classmethod
    def update_preferences(cls, user_id: str, updates: Dict[str, Any]):
        current = cls.get_preferences(user_id)
        current.update(updates)
        cls._user_preferences[user_id] = current


class PrivacySanitizer:
    @classmethod
    def sanitize_dict(cls, data: Dict[str, Any]) -> Dict[str, Any]:
        """Deeply removes any sensitive keys like password, otp, token, pin, secret."""
        clean = {}
        for k, v in data.items():
            if any(secret_term in k.lower() for secret_term in ['password', 'otp', 'pin', 'secret', 'token']):
                clean[k] = '[REDACTED_SECRET]'
            elif isinstance(v, dict):
                clean[k] = cls.sanitize_dict(v)
            else:
                clean[k] = v
        return clean

    @classmethod
    def sanitize_text(cls, text: Optional[str]) -> Optional[str]:
        if not text:
            return text
        import re
        # Redact JWTs and bearer tokens
        sanitized = re.sub(r'eyJ[a-zA-Z0-9_\-\.]+', '[REDACTED_TOKEN]', text)
        sanitized = re.sub(r'Bearer\s+[a-zA-Z0-9_\-\.]+', 'Bearer [REDACTED_TOKEN]', sanitized, flags=re.IGNORECASE)
        # Redact passwords and pin patterns
        sanitized = re.sub(r'password\s*[:=]\s*\S+', 'password: [REDACTED_SECRET]', sanitized, flags=re.IGNORECASE)
        sanitized = re.sub(r'pin\s*[:=]\s*\d+', 'pin: [REDACTED_SECRET]', sanitized, flags=re.IGNORECASE)
        return sanitized
