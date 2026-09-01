# Feature Store & Schema Definitions (Phase 7 Real-World Learning & Continuous Intelligence)
import numpy as np
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field


class FeatureStore:
    """
    Central Feature Repository and Normalization Engine for ELA ML & Neural Models.
    """

    FEATURE_SCHEMAS = {
        "demand": ["commodity_encoded", "day_of_week", "month", "historical_avg_demand", "mandi_arrival_volume"],
        "price": ["commodity_encoded", "modal_price", "arrival_volume_tonnes", "seasonal_factor", "distance_to_mandi"],
        "eta": ["distance_km", "departure_hour", "day_of_week", "weather_risk", "checkpoint_count", "corridor_congestion"],
        "transport_cost": ["distance_km", "cargo_weight_kg", "fuel_price", "toll_charges", "vehicle_type_factor"],
        "matching": ["cargo_weight_kg", "cargo_volume_cbm", "vehicle_capacity_kg", "transporter_rating", "urgency_factor"],
        "delay_risk": ["distance_km", "departure_hour", "day_of_week", "loading_time_minutes", "checkpoint_count", "weather_risk_index"],
        "cancellation_risk": ["price_spread_pct", "hours_to_dispatch", "transporter_rating", "farmer_trip_count", "commodity_perishability_code"],
        "delivery_success": ["distance_km", "cargo_weight_kg", "vehicle_capacity_kg", "transporter_reliability_score", "delay_risk", "cancellation_risk"],
    }

    COMMODITY_MAPPING = {
        "tomatoes": 1, "tomato": 1, "tamatar": 1, "टोमॅटो": 1, "टमाटर": 1,
        "onions": 2, "onion": 2, "pyaz": 2, "कांदा": 2, "प्याज": 2,
        "potatoes": 3, "potato": 3, "aloo": 3, "बटाटा": 3, "आलू": 3,
        "grapes": 4, "grape": 4, "angur": 4, "द्राक्षे": 4, "अंगूर": 4,
        "pomegranates": 5, "dalimb": 5, "anaar": 5, "डाळिंब": 5, "अनार": 5,
        "wheat": 6, "gehun": 6, "गहू": 6, "गेहूं": 6,
        "rice": 7, "chawal": 7, "तांदूळ": 7, "चावल": 7,
    }

    @classmethod
    def encode_commodity(cls, commodity_name: str) -> int:
        norm = (commodity_name or "").lower().strip()
        return cls.COMMODITY_MAPPING.get(norm, 0)

    @classmethod
    def extract_features_for_model(cls, model_type: str, raw_features: Dict[str, Any]) -> Dict[str, float]:
        schema = cls.FEATURE_SCHEMAS.get(model_type.lower(), [])
        extracted: Dict[str, float] = {}

        for feat in schema:
            val = raw_features.get(feat, 0.0)
            if isinstance(val, (int, float)):
                extracted[feat] = float(val)
            elif isinstance(val, str):
                if feat == "commodity_encoded":
                    extracted[feat] = float(cls.encode_commodity(val))
                else:
                    try:
                        extracted[feat] = float(val)
                    except Exception:
                        extracted[feat] = 0.0
            else:
                extracted[feat] = 0.0

        return extracted
