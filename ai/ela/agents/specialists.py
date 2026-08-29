# Specialized Multi-Agent Specialists Layer (Phase 5 Core Intelligence Fusion)
# Implements internal specialist agents operating seamlessly under ONE unified ELA identity.
import asyncio
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
from datetime import datetime

from ai.ela.ml.models.demand import DemandPredictionModel, DemandFeatures
from ai.ela.ml.models.price import PricePredictionModel, PriceFeatures
from ai.ela.ml.models.eta import ETAPredictionModel, EtaFeatures
from ai.ela.ml.models.transport import TransportCostModel, TransportCostFeatures
from ai.ela.ml.models.matching import VehicleMatchingModel, VehicleMatchingFeatures
from ai.ela.knowledge.engine import KnowledgeEngine
from ai.ela.learning.collector import FeedbackCollector
from ai.ela.learning.patterns import PatternMiner


class AgentSpecialistResult(BaseModel):
    specialist_name: str
    status: str
    data: Dict[str, Any]
    summary: str
    confidence: float


class MarketAgent:
    """Specialist for APMC Mandi price discovery and crop demand forecasting."""
    def __init__(self, demand_model: DemandPredictionModel, price_model: PricePredictionModel, knowledge: KnowledgeEngine):
        self.demand_model = demand_model
        self.price_model = price_model
        self.knowledge = knowledge

    async def analyze_market(self, commodity: str, grade: str = "A", mandi: str = "Pune APMC Mandi") -> AgentSpecialistResult:
        price_res = await self.price_model.predict(
            PriceFeatures(commodity=commodity, grade=grade, mandi_location=mandi)
        )
        demand_res = await self.demand_model.predict(
            DemandFeatures(commodity=commodity, mandi=mandi)
        )
        c_fact = self.knowledge.get_commodity_info(commodity)

        return AgentSpecialistResult(
            specialist_name="MarketAgent",
            status="SUCCESS",
            data={
                "price": price_res.prediction.model_dump(),
                "demand": demand_res.prediction.model_dump(),
                "commodity_info": c_fact.model_dump() if c_fact else None,
            },
            summary=f"Mandi spot price for {commodity} is ₹{price_res.prediction.predicted_avg_price:.2f}/kg ({price_res.prediction.trend} trend). Demand is {demand_res.prediction.demand_level}.",
            confidence=min(price_res.confidence, demand_res.confidence),
        )


class FleetAgent:
    """Specialist for vehicle capacity verification and multi-objective fleet allocation."""
    def __init__(self, matching_model: VehicleMatchingModel, knowledge: KnowledgeEngine):
        self.matching_model = matching_model
        self.knowledge = knowledge

    async def match_fleet(self, cargo_weight_kg: float, available_vehicles: List[Dict[str, Any]]) -> AgentSpecialistResult:
        res = await self.matching_model.predict(
            VehicleMatchingFeatures(cargo_weight_kg=cargo_weight_kg, available_vehicles=available_vehicles)
        )
        top = res.prediction.top_recommendation
        return AgentSpecialistResult(
            specialist_name="FleetAgent",
            status="SUCCESS",
            data=res.prediction.model_dump(),
            summary=f"Matched {res.prediction.total_vehicles_evaluated} vehicles. Top choice: {top.vehicle_type if top else 'None'} ({top.recommended_reason if top else ''}).",
            confidence=res.confidence,
        )


class LogisticsAgent:
    """Specialist for shipment routing, transit duration, and freight tariff estimation."""
    def __init__(self, eta_model: ETAPredictionModel, cost_model: TransportCostModel, knowledge: KnowledgeEngine):
        self.eta_model = eta_model
        self.cost_model = cost_model
        self.knowledge = knowledge

    async def plan_logistics(
        self,
        origin: str,
        destination: str,
        commodity: str,
        weight_kg: float,
        vehicle_type: str = "Mini Truck (750 kg)",
        departure_hour: int = 8,
    ) -> AgentSpecialistResult:
        distance_km = 210.0 if "nashik" in origin.lower() and "pune" in destination.lower() else 85.0

        eta_res = await self.eta_model.predict(
            EtaFeatures(
                origin=origin,
                destination=destination,
                distance_km=distance_km,
                vehicle_type=vehicle_type,
                departure_hour=departure_hour,
            )
        )
        cost_res = await self.cost_model.predict(
            TransportCostFeatures(
                distance_km=distance_km,
                weight_kg=weight_kg,
                vehicle_type=vehicle_type,
            )
        )

        transit_hours = eta_res.prediction.estimated_duration_minutes / 60.0
        is_perish_urgent, perish_note = self.knowledge.check_perishability_urgency(commodity, transit_hours)

        return AgentSpecialistResult(
            specialist_name="LogisticsAgent",
            status="SUCCESS",
            data={
                "eta": eta_res.prediction.model_dump(),
                "cost": cost_res.prediction.model_dump(),
                "perishability_check": {"is_urgent": is_perish_urgent, "note": perish_note},
            },
            summary=f"Transit ETA: {eta_res.prediction.formatted_duration}, Estimated Freight: ₹{cost_res.prediction.estimated_cost:.0f} ({cost_res.prediction.breakdown}).",
            confidence=min(eta_res.confidence, cost_res.confidence),
        )


class LearningAgent:
    """Specialist for operational outcome ingestion and pattern discrepancy detection."""
    @staticmethod
    def record_trip_outcome(
        session_id: str,
        predicted_eta_mins: float,
        actual_eta_mins: float,
        predicted_cost: float,
        actual_cost: float,
        route: str = "Nashik-Pune",
    ) -> AgentSpecialistResult:
        rec_eta = FeedbackCollector.record_feedback(
            session_id=session_id,
            action_type="LOGISTICS_TRIP",
            prediction_made={"predicted": predicted_eta_mins, "route": route},
            actual_outcome={"actual": actual_eta_mins},
        )
        return AgentSpecialistResult(
            specialist_name="LearningAgent",
            status="SUCCESS",
            data={"record_id": rec_eta.record_id, "error_delta": rec_eta.error_delta},
            summary=f"Recorded trip telemetry (ETA Error: {rec_eta.error_delta:+.1f} mins). Discrepancy queued for governed pattern analysis.",
            confidence=1.0,
        )
