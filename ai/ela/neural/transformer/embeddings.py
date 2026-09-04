# ELA Neural Representation & Token Vectorization (Phase 12.1)
import re
import numpy as np
from typing import Dict, Any, List, Optional, Tuple
from pydantic import BaseModel, Field
from ai.ela.security.guard import SecurityGuard

try:
    import torch
    import torch.nn as nn
    HAS_TORCH = True
except ImportError:
    HAS_TORCH = False


class ElaNeuralInput(BaseModel):
    """
    Standardized input contract for the ELA Transformer Neural Subsystem.
    Transfers structured conversation, role, goal, entity, and operational state.
    """
    session_id: str = Field(default_factory=lambda: f"sess-{__import__('uuid').uuid4().hex[:8]}")
    goal_id: Optional[str] = None
    language: str = "en"
    role: str = "GUEST"
    user_role: Optional[str] = None
    intent: str = "GENERAL_HELP"
    entities: Dict[str, Any] = Field(default_factory=dict)
    context: Dict[str, Any] = Field(default_factory=dict)
    constraints: Dict[str, Any] = Field(default_factory=dict)
    memory_features: Dict[str, Any] = Field(default_factory=dict)
    operational_features: Dict[str, Any] = Field(default_factory=dict)
    raw_text: Optional[str] = None

    def model_post_init(self, __context: Any) -> None:
        if self.user_role and self.role == "GUEST":
            self.role = self.user_role


class ElaInputVectorizer:
    """
    Deterministic tokenizer & feature sequence builder for ELA Neural Input.
    Encodes roles, language, strategy, commodity, location, and text tokens into
    deterministic integer IDs within the configured vocabulary.
    """
    # Special tokens
    PAD_TOKEN = 0
    CLS_TOKEN = 1
    SEP_TOKEN = 2
    UNK_TOKEN = 3

    # Role tokens
    ROLE_MAP = {
        "GUEST": 10,
        "FARMER": 11,
        "BUYER": 12,
        "TRANSPORTER": 13,
        "ADMIN": 14,
    }

    # Language tokens
    LANG_MAP = {
        "en": 20,
        "hi": 21,
        "mr": 22,
        "ta": 23,
        "te": 24,
        "bn": 25,
        "kn": 26,
    }

    # Strategy tokens
    STRAT_MAP = {
        "BALANCED": 30,
        "CHEAPEST": 31,
        "FASTEST": 32,
        "HIGHEST_RATED": 33,
        "MOST_RELIABLE": 34,
        "HIGHEST_RELIABILITY": 34,
    }

    # Common commodities
    COMMODITY_MAP = {
        "tomatoes": 40,
        "tomato": 40,
        "tamatar": 40,
        "onions": 41,
        "onion": 41,
        "pyaz": 41,
        "potatoes": 42,
        "potato": 42,
        "aloo": 42,
        "grains": 43,
        "wheat": 43,
        "rice": 43,
        "vegetables": 44,
        "fruits": 45,
    }

    # Hub cities
    LOC_MAP = {
        "nashik": 50,
        "pune": 51,
        "mumbai": 52,
        "kolhapur": 53,
        "nagpur": 54,
        "surat": 55,
        "baramati": 56,
        "solapur": 57,
    }

    # Canonical Intents
    INTENT_MAP = {
        "GENERAL_HELP": 60,
        "CREATE_LOGISTICS_WORKFLOW": 61,
        "MOVE_PRODUCE": 61,
        "GET_MARKET_DEMAND": 62,
        "GET_FARMER_PRODUCTS": 63,
        "CREATE_PRODUCT_WORKFLOW": 64,
        "CREATE_PROCUREMENT_WORKFLOW": 65,
        "GET_BUYER_PRODUCE": 66,
        "GET_AVAILABLE_TRIPS": 67,
        "CREATE_VEHICLE_WORKFLOW": 68,
        "LOGIN_GUIDANCE": 69,
        "ROLE_DECLARATION": 70,
    }

    # Cognitive Memory Category Tokens (Phase 12.2)
    MEMORY_CAT_MAP = {
        "EPISODIC": 71,
        "SEMANTIC": 72,
        "GOAL": 73,
        "DECISION": 74,
        "OUTCOME": 75,
        "OPERATIONAL": 76,
        "CONSTRAINT": 77,
        "WARNING": 78,
    }

    # Cognitive Decision & Outcome Tokens
    VEHICLE_MEMORY_MAP = {
        "mini truck": 80,
        "pickup": 81,
        "truck": 82,
        "reefer": 83,
        "trailer": 84,
    }
    OUTCOME_MEMORY_MAP = {
        "SUCCESS": 85,
        "FAILED": 86,
        "DELAYED": 87,
    }

    @classmethod
    def vectorize(cls, input_data: ElaNeuralInput, max_seq_len: int = 32) -> Tuple[np.ndarray, np.ndarray, Dict[str, float]]:
        """
        Transforms ElaNeuralInput into:
        1. token_ids: np.ndarray of shape (max_seq_len,)
        2. attention_mask: np.ndarray of shape (max_seq_len,) [1 for valid token, 0 for pad]
        3. numerical_features: Dict of operational scalars
        """
        # Strict Credential Shielding check
        text = input_data.raw_text or ""
        safety = SecurityGuard.check_safety(text, input_data.role)
        if safety.credential_shielded:
            text = "[SHIELDED_SENSITIVE_CONTENT]"

        tokens = [cls.CLS_TOKEN]

        # 1. Structural context tokens
        role_tok = cls.ROLE_MAP.get(input_data.role.upper(), cls.UNK_TOKEN)
        tokens.append(role_tok)

        lang_tok = cls.LANG_MAP.get(input_data.language.lower(), cls.UNK_TOKEN)
        tokens.append(lang_tok)

        strat = input_data.context.get("strategy", input_data.entities.get("strategy", "BALANCED"))
        strat_tok = cls.STRAT_MAP.get(strat.upper(), cls.STRAT_MAP["BALANCED"])
        tokens.append(strat_tok)

        intent_tok = cls.INTENT_MAP.get(input_data.intent, cls.INTENT_MAP["GENERAL_HELP"])
        tokens.append(intent_tok)

        # 1.5 Cognitive Memory Context Tokens (Phase 12.2 Context Fusion)
        mem_cats = input_data.memory_features.get("memory_categories", [])
        for cat in mem_cats[:3]:
            cat_tok = cls.MEMORY_CAT_MAP.get(str(cat).upper())
            if cat_tok:
                tokens.append(cat_tok)

        prev_veh = str(input_data.memory_features.get("previous_recommended_vehicle", "")).lower()
        for v_name, v_tok in cls.VEHICLE_MEMORY_MAP.items():
            if v_name in prev_veh:
                tokens.append(v_tok)
                break

        if input_data.memory_features.get("has_verified_outcome"):
            tokens.append(cls.OUTCOME_MEMORY_MAP["SUCCESS"])

        # 2. Entity tokens
        comm = (input_data.entities.get("commodity") or input_data.entities.get("product") or "").lower()
        if comm:
            tokens.append(cls.COMMODITY_MAP.get(comm, 49))

        pickup = (input_data.entities.get("pickup_location") or "").lower()
        for city, tok in cls.LOC_MAP.items():
            if city in pickup:
                tokens.append(tok)
                break

        dest = (input_data.entities.get("destination") or "").lower()
        for city, tok in cls.LOC_MAP.items():
            if city in dest:
                tokens.append(tok)
                break

        # 3. Message character/subword hashing tokens (vocab space 100 to 250)
        clean_words = re.findall(r"\w+", text.lower())
        for word in clean_words:
            if len(tokens) >= max_seq_len - 1:
                break
            # Deterministic hash to token ID
            h = abs(hash(word)) % 150 + 100
            tokens.append(h)

        tokens.append(cls.SEP_TOKEN)

        # Truncate if necessary
        tokens = tokens[:max_seq_len]
        valid_len = len(tokens)

        # Build padded array and attention mask
        token_ids = np.zeros(max_seq_len, dtype=np.int64)
        token_ids[:valid_len] = tokens

        attention_mask = np.zeros(max_seq_len, dtype=np.float32)
        attention_mask[:valid_len] = 1.0

        # Normalized operational & cognitive features
        weight_kg = float(input_data.operational_features.get("weight_kg", input_data.entities.get("quantity", 500.0) or 500.0))
        distance_km = float(input_data.operational_features.get("distance_km", 200.0))
        mem_count = float(input_data.memory_features.get("memory_count", 0))
        numerical_features = {
            "norm_weight": min(max(weight_kg / 10000.0, 0.0), 1.0),
            "norm_distance": min(max(distance_km / 1000.0, 0.0), 1.0),
            "norm_memory_count": min(max(mem_count / 10.0, 0.0), 1.0),
            "has_active_constraint": 1.0 if (input_data.memory_features.get("has_active_constraint") or "CONSTRAINT" in mem_cats) else 0.0,
            "has_warning": 1.0 if (input_data.memory_features.get("has_warning") or "WARNING" in mem_cats) else 0.0,
            "has_decision": 1.0 if (input_data.memory_features.get("has_decision") or "DECISION" in mem_cats) else 0.0,
            "has_verified_outcome": 1.0 if input_data.memory_features.get("has_verified_outcome") else 0.0,
        }

        return token_ids, attention_mask, numerical_features


if HAS_TORCH:
    class TorchTokenEmbedding(nn.Module):
        """Learnable Token Embedding table."""
        def __init__(self, vocab_size: int, d_model: int):
            super().__init__()
            self.embedding = nn.Embedding(vocab_size, d_model, padding_idx=0)
            self.d_model = d_model

        def forward(self, token_ids: torch.Tensor) -> torch.Tensor:
            return self.embedding(token_ids) * (self.d_model ** 0.5)
