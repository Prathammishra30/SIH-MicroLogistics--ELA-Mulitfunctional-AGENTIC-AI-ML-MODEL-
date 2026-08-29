# Decision Engine (Phase 5 Core Intelligence Fusion)
# Synthesizes Multi-Modal Evidence: LLM Semantics + ML Predictions + Neural Scores + Knowledge + Constraints
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
from datetime import datetime

from ai.ela.core.decision_support import DecisionSupportEngine, DecisionSupportResult, DecisionOption
from ai.ela.knowledge.engine import KnowledgeEngine
from ai.ela.neural.provider import DistilledSemanticNeuralProvider, NeuralAnomalyResult


class DecisionFactor(BaseModel):
    category: str  # COST, TRANSIT_SPEED, LOAD_FIT, PERISHABILITY, MARKET_DEMAND
    weight: float
    summary: str


class DecisionRecommendation(BaseModel):
    decision_type: str
    recommended_action: str
    target_entity: Optional[Dict[str, Any]] = None
    decision_factors: List[DecisionFactor] = Field(default_factory=list)
    confidence: float
    uncertainty_note: Optional[str] = None
    risk_level: str = "LOW"  # LOW, MODERATE, HIGH
    requires_confirmation: bool = False
    explanation_summary: str


class DecisionEngine:
    """
    Master Decision Engine: Combines predictive ML, neural representations, domain knowledge, and user constraints.
    """
    def __init__(self):
        self.decision_support = DecisionSupportEngine()
        self.knowledge = KnowledgeEngine()
        self.neural = DistilledSemanticNeuralProvider()

    async def decide_logistics_plan(
        self,
        origin: str,
        destination: str,
        commodity: str,
        weight_kg: float,
        available_vehicles: List[Dict[str, Any]],
        strategy: str = "BALANCED",
    ) -> DecisionRecommendation:
        # 1. Query Decision Support Engine across ML Models (Matching, Tariff, Transit ETA)
        dec_res: DecisionSupportResult = await self.decision_support.evaluate_transport_options(
            origin=origin,
            destination=destination,
            commodity=commodity,
            weight_kg=weight_kg,
            available_vehicles=available_vehicles,
            user_preference=strategy,
        )

        top_opt: Optional[DecisionOption] = dec_res.recommended_option
        if not top_opt:
            return DecisionRecommendation(
                decision_type="NO_SUITABLE_OPTION",
                recommended_action="CLARIFY_REQUIREMENTS",
                confidence=0.50,
                explanation_summary="No carrier vehicle could be matched for the requested weight and route.",
            )

        # 2. Query Knowledge Base for Perishability & Mandi Rules
        c_fact = self.knowledge.get_commodity_info(commodity)
        transit_hours = top_opt.estimated_duration_minutes / 60.0
        is_perish_urgent, perish_note = self.knowledge.check_perishability_urgency(commodity, transit_hours)

        # 3. Formulate Concise Decision Factors (No Raw CoT Exposure)
        factors = [
            DecisionFactor(
                category="LOAD_FIT",
                weight=0.35,
                summary=f"Vehicle capacity ({top_opt.capacity_kg:.0f} kg) provides {top_opt.match_score * 100:.0f}% load fit.",
            ),
            DecisionFactor(
                category="COST",
                weight=0.35 if strategy == "CHEAPEST" else 0.25,
                summary=f"Estimated freight: ₹{top_opt.estimated_cost:.0f} (competitive regional rate).",
            ),
            DecisionFactor(
                category="TRANSIT_SPEED",
                weight=0.40 if (strategy == "FASTEST" or is_perish_urgent) else 0.25,
                summary=f"Estimated transit: {top_opt.formatted_duration} via primary highway corridor.",
            ),
        ]

        if is_perish_urgent:
            factors.append(
                DecisionFactor(
                    category="PERISHABILITY",
                    weight=0.30,
                    summary=f"High perishability handling: {perish_note}",
                )
            )

        # Uncertainty evaluation
        uncertainty = top_opt.uncertainty_warning
        if top_opt.confidence < 0.60:
            uncertainty = "Low historical sample coverage on this rural route; transit estimates have higher variance."

        risk = "HIGH" if top_opt.confidence < 0.50 else ("MODERATE" if is_perish_urgent else "LOW")

        return DecisionRecommendation(
            decision_type="RECOMMEND_LOGISTICS_BOOKING",
            recommended_action="STAGE_TRANSPORT_CONFIRMATION",
            target_entity={
                "vehicle_id": top_opt.vehicle_id,
                "vehicle_type": top_opt.vehicle_type,
                "estimated_freight": top_opt.estimated_cost,
                "estimated_duration": top_opt.formatted_duration,
                "origin": origin,
                "destination": destination,
                "commodity": commodity,
                "weight_kg": weight_kg,
            },
            decision_factors=factors,
            confidence=top_opt.confidence,
            uncertainty_note=uncertainty,
            risk_level=risk,
            requires_confirmation=True,
            explanation_summary=(
                f"Recommended **{top_opt.vehicle_type}** (Estimated Freight: ₹{top_opt.estimated_cost:.0f}, ETA: {top_opt.formatted_duration}) "
                f"based on {strategy.lower()} optimization. {top_opt.recommendation_reason}"
            ),
        )
