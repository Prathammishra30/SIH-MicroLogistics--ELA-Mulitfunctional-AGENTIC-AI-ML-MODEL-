# Risk Agent (Phase 9 Operational Risk, Delay & Anomaly Intelligence)
# Evaluates multi-factor risk: route delay, transporter cancellation, delivery success, and out-of-distribution (OOD) states.
from typing import Dict, Any, List
from ai.ela.agents.base import BaseSpecializedAgent
from ai.ela.agents.contracts import AgentRequest, AgentResponse
from ai.ela.ml.models.risk import (
    DelayProbabilityModel,
    DelayRiskFeatures,
    CancellationProbabilityModel,
    CancellationRiskFeatures,
    DeliverySuccessProbabilityModel,
    DeliverySuccessFeatures,
)


class RiskAgent(BaseSpecializedAgent):
    """
    Specialized agent evaluating operational trip certainty, route bottlenecks, driver cancellation risk,
    and out-of-distribution route conditions.
    """

    def __init__(self):
        super().__init__(
            agent_id="RiskAgent",
            capabilities=[
                "DELAY_RISK_ANALYSIS",
                "CANCELLATION_RISK_ANALYSIS",
                "DELIVERY_SUCCESS_EVALUATION",
                "OOD_RISK_DETECTION",
                "ROUTE_ANOMALY_DETECTION",
            ],
            allowed_roles=['GUEST', 'FARMER', 'BUYER', 'TRANSPORTER'],
            allowed_tools=[],
            dependencies=[],
        )
        self.delay_model = DelayProbabilityModel()
        self.cancel_model = CancellationProbabilityModel()
        self.success_model = DeliverySuccessProbabilityModel()

    async def execute(self, request: AgentRequest) -> AgentResponse:
        entities = request.entities
        params = request.parameters
        weight_kg = float(entities.quantity or params.get("weight_kg", 500.0))
        origin = entities.pickup_location or params.get("origin", "Nashik")
        dest = entities.destination or params.get("destination", "Pune APMC Mandi")
        v_type = entities.vehicle_type or params.get("vehicle_type", "Mini Truck (750 kg)")
        rating = float(params.get("transporter_rating", 4.8))
        v_cap = float(params.get("vehicle_capacity_kg", 750.0))

        distance_km = 210.0 if ("nashik" in origin.lower() and "pune" in dest.lower()) else 85.0

        # 1. Out-of-Distribution (OOD) Check
        is_ood = weight_kg > 25000.0 or distance_km > 2000.0 or weight_kg < 1.0
        warnings = []
        if is_ood:
            warnings.append("Requested cargo parameters fall outside standard regional logistics distributions.")

        # 2. Risk Model Predictions
        delay_res = await self.delay_model.predict(
            DelayRiskFeatures(distance_km=distance_km, vehicle_type=v_type)
        )
        cancel_res = await self.cancel_model.predict(
            CancellationRiskFeatures(transporter_rating=rating)
        )
        success_res = await self.success_model.predict(
            DeliverySuccessFeatures(
                distance_km=distance_km,
                cargo_weight_kg=weight_kg,
                vehicle_capacity_kg=v_cap,
                transporter_reliability_score=rating / 5.0,
                delay_risk=delay_res.prediction.delay_probability,
                cancellation_risk=cancel_res.prediction.cancellation_probability,
            )
        )

        d_prob = delay_res.prediction.delay_probability
        c_prob = cancel_res.prediction.cancellation_probability
        s_prob = success_res.prediction.success_probability

        # Overall Risk Level classification
        if is_ood or d_prob > 0.85 or c_prob > 0.40 or s_prob < 0.40:
            risk_level = "CRITICAL"
        elif d_prob > 0.65 or c_prob > 0.20 or s_prob < 0.65:
            risk_level = "HIGH"
        elif d_prob > 0.35 or c_prob > 0.10:
            risk_level = "MODERATE"
        else:
            risk_level = "LOW"

        risk_data = {
            "risk_level": risk_level,
            "delay_probability": round(d_prob, 3),
            "expected_delay_minutes": delay_res.prediction.expected_delay_minutes,
            "cancellation_probability": round(c_prob, 3),
            "delivery_success_probability": round(s_prob, 3),
            "reliability_tier": success_res.prediction.reliability_tier,
            "ood": is_ood,
            "primary_risk_factors": delay_res.prediction.primary_risk_factors,
            "mitigation_suggestion": delay_res.prediction.mitigation_suggestion,
            "explanation": f"Overall operational risk evaluated as {risk_level} with {s_prob * 100:.1f}% delivery success certainty.",
        }

        avg_conf = (delay_res.confidence + cancel_res.confidence + success_res.confidence) / 3.0
        if is_ood:
            avg_conf *= 0.70

        return AgentResponse(
            agent_id=self.agent_id,
            task_id=request.task_id,
            status='SUCCESS',
            data=risk_data,
            confidence=round(avg_conf, 2),
            warnings=warnings,
            models_used=["DelayProbabilityModel", "CancellationProbabilityModel", "DeliverySuccessProbabilityModel"],
            reasoning_summary=f"Risk: {risk_level} (Delay: {d_prob * 100:.0f}%, Cancel: {c_prob * 100:.0f}%, Success: {s_prob * 100:.1f}%).",
        )
