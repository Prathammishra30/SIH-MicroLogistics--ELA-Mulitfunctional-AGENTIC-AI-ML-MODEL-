# Decision Support Engine (Phase 5B Python Core)
# Combines User Constraints, ML Predictions (Matching, Tariff, Transit ETA), and Generates Explainable Rankings
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from ai.ela.ml.models.matching import VehicleMatchingModel, VehicleMatchingFeatures
from ai.ela.ml.models.transport import TransportCostModel, TransportCostFeatures
from ai.ela.ml.models.eta import ETAPredictionModel, EtaFeatures


class DecisionOption(BaseModel):
    vehicle_id: str
    vehicle_type: str
    capacity_kg: float
    estimated_cost: float
    estimated_duration_minutes: int
    formatted_duration: str
    match_score: float
    composite_score: float
    is_recommended: bool = False
    recommendation_reason: str
    confidence: float
    uncertainty_warning: Optional[str] = None


class DecisionSupportResult(BaseModel):
    recommended_option: Optional[DecisionOption]
    all_ranked_options: List[DecisionOption]
    strategy_applied: str  # CHEAPEST, FASTEST, FRESHNESS, BALANCED
    explanation_summary: str
    confidence: float


class DecisionSupportEngine:
    """
    Synthesizes multiple predictive ML models to rank operational choices based on user priorities.
    """
    def __init__(self):
        self.matching_model = VehicleMatchingModel()
        self.cost_model = TransportCostModel()
        self.eta_model = ETAPredictionModel()

    async def evaluate_transport_options(
        self,
        origin: str,
        destination: str,
        commodity: str,
        weight_kg: float,
        available_vehicles: List[Dict[str, Any]],
        user_preference: str = "BALANCED",  # CHEAPEST, FASTEST, FRESHNESS, BALANCED
        departure_hour: int = 8,
    ) -> DecisionSupportResult:
        if not available_vehicles:
            available_vehicles = [
                {"id": "veh-1", "type": "Mini Truck (750 kg)", "capacity": 750.0, "rating": 4.8},
                {"id": "veh-2", "type": "Pickup Van (1.5 Ton)", "capacity": 1500.0, "rating": 4.5},
                {"id": "veh-3", "type": "Medium Truck (3.5 Ton)", "capacity": 3500.0, "rating": 4.9},
            ]

        # Weights per user preference strategy
        if user_preference == "CHEAPEST":
            w_cost, w_eta, w_match = 0.65, 0.15, 0.20
        elif user_preference == "FASTEST":
            w_cost, w_eta, w_match = 0.20, 0.60, 0.20
        elif user_preference == "FRESHNESS":
            w_cost, w_eta, w_match = 0.25, 0.45, 0.30
        else:  # BALANCED
            w_cost, w_eta, w_match = 0.40, 0.30, 0.30

        evaluated_options: List[DecisionOption] = []
        distance_km = 210.0 if "nashik" in origin.lower() and "pune" in destination.lower() else 85.0

        for v in available_vehicles:
            v_id = v.get("id", "veh-0")
            v_type = v.get("type", "Mini Truck (750 kg)")
            v_cap = float(v.get("capacity", 1000.0))

            # 1. Vehicle Match
            match_res = await self.matching_model.predict(
                VehicleMatchingFeatures(
                    cargo_weight_kg=weight_kg,
                    cargo_volume_cbm=weight_kg / 200.0,
                    available_vehicles=[v],
                )
            )
            top_match = match_res.prediction.top_recommendation
            m_score = top_match.match_score if top_match else 0.5

            # 2. Cost Prediction
            cost_res = await self.cost_model.predict(
                TransportCostFeatures(
                    distance_km=distance_km,
                    weight_kg=weight_kg,
                    vehicle_type=v_type,
                )
            )
            est_cost = cost_res.prediction.estimated_cost

            # 3. ETA Prediction
            eta_res = await self.eta_model.predict(
                EtaFeatures(
                    origin=origin,
                    destination=destination,
                    distance_km=distance_km,
                    vehicle_type=v_type,
                    departure_hour=departure_hour,
                )
            )
            est_mins = eta_res.prediction.estimated_duration_minutes
            fmt_dur = eta_res.prediction.formatted_duration

            # Compute Normalized Composite Score (Higher is better)
            # Cost factor: cheaper is better relative to base 4000
            cost_factor = max(0.1, min(1.0, 1.0 - (est_cost - 1500.0) / 4000.0))
            # ETA factor: faster is better relative to 360 mins
            eta_factor = max(0.1, min(1.0, 1.0 - (est_mins - 60.0) / 300.0))

            composite = (w_cost * cost_factor) + (w_eta * eta_factor) + (w_match * m_score)

            # Check confidence uncertainty
            avg_conf = (match_res.confidence + cost_res.confidence + eta_res.confidence) / 3.0
            warning = None
            if avg_conf < 0.60:
                warning = "Prediction contains higher variance due to sparse historical route data."

            # Construct explainable rationale
            if user_preference == "CHEAPEST":
                reason = f"Lowest estimated freight (₹{est_cost:.0f}) for {weight_kg:.0f} kg load."
            elif user_preference == "FASTEST" or user_preference == "FRESHNESS":
                reason = f"Fastest transit ({fmt_dur}) to preserve {commodity} freshness."
            else:
                reason = f"Optimal balance of capacity fit ({v_cap:.0f} kg), freight (₹{est_cost:.0f}), and ETA ({fmt_dur})."

            evaluated_options.append(
                DecisionOption(
                    vehicle_id=v_id,
                    vehicle_type=v_type,
                    capacity_kg=v_cap,
                    estimated_cost=est_cost,
                    estimated_duration_minutes=est_mins,
                    formatted_duration=fmt_dur,
                    match_score=m_score,
                    composite_score=round(composite, 3),
                    recommendation_reason=reason,
                    confidence=round(avg_conf, 2),
                    uncertainty_warning=warning,
                )
            )

        # Rank by composite score descending
        evaluated_options.sort(key=lambda x: x.composite_score, reverse=True)
        if evaluated_options:
            evaluated_options[0].is_recommended = True

        top = evaluated_options[0] if evaluated_options else None
        summary = (
            f"Recommended {top.vehicle_type} (₹{top.estimated_cost:.0f}, {top.formatted_duration}) based on {user_preference.lower()} priority."
            if top else "No compatible transport options found."
        )

        return DecisionSupportResult(
            recommended_option=top,
            all_ranked_options=evaluated_options,
            strategy_applied=user_preference,
            explanation_summary=summary,
            confidence=top.confidence if top else 0.85,
        )
