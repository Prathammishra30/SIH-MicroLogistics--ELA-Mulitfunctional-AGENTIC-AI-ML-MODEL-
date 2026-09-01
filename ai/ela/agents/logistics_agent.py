# Logistics Agent (Phase 9 Corridor Routing, Vehicle Selection & Freight Tariff Intelligence)
from typing import Dict, Any, List
from ai.ela.agents.base import BaseSpecializedAgent
from ai.ela.agents.contracts import AgentRequest, AgentResponse
from ai.ela.core.decision_support import DecisionSupportEngine, DecisionSupportResult


class LogisticsAgent(BaseSpecializedAgent):
    """
    Specialized agent for route analysis, multi-criteria vehicle matching, freight rate prediction,
    and transport booking staging.
    """

    def __init__(self):
        super().__init__(
            agent_id="LogisticsAgent",
            capabilities=[
                "ROUTE_ANALYSIS",
                "VEHICLE_SELECTION",
                "FREIGHT_TARIFF_PREDICTION",
                "ETA_CALCULATION",
                "TRANSPORT_WORKFLOW_STAGING",
            ],
            allowed_roles=['GUEST', 'FARMER', 'BUYER', 'TRANSPORTER'],
            allowed_tools=['create_logistics_request'],
            dependencies=[],
        )
        self.decision_support = DecisionSupportEngine()

    async def execute(self, request: AgentRequest) -> AgentResponse:
        entities = request.entities
        params = request.parameters
        origin = entities.pickup_location or params.get("origin", "Nashik")
        dest = entities.destination or params.get("destination", "Pune APMC Mandi")
        commodity = entities.product or entities.commodity or params.get("commodity", "Tomatoes")
        weight_kg = float(entities.quantity or params.get("weight_kg", 500.0))
        strat = request.strategy or entities.strategy or "BALANCED"

        avail_vehicles = params.get("available_vehicles", [])

        # Multi-Criteria Evaluation using Decision Support Engine
        dec_res: DecisionSupportResult = await self.decision_support.evaluate_transport_options(
            origin=origin,
            destination=dest,
            commodity=commodity,
            weight_kg=weight_kg,
            available_vehicles=avail_vehicles,
            user_preference=strat,
        )

        top = dec_res.recommended_option
        if not top:
            return AgentResponse(
                agent_id=self.agent_id,
                task_id=request.task_id,
                status='FAILED',
                error_message="No compatible transport options found for the specified route and payload.",
                confidence=0.50,
            )

        recommended_action = {
            "toolName": "create_logistics_request",
            "actionType": "STAGED_MUTATION",
            "params": {
                "pickupLocation": origin,
                "destination": dest,
                "productName": commodity,
                "quantity": weight_kg,
                "vehicleType": top.vehicle_type,
                "estimatedFreight": top.estimated_cost,
                "estimatedDuration": top.formatted_duration,
            },
        }

        data = {
            "origin": origin,
            "destination": dest,
            "commodity": commodity,
            "weight_kg": weight_kg,
            "strategy": strat,
            "recommended_vehicle": top.model_dump(),
            "all_ranked_options": [opt.model_dump() for opt in dec_res.all_ranked_options],
            "decision_trace": dec_res.decision_trace,
        }

        return AgentResponse(
            agent_id=self.agent_id,
            task_id=request.task_id,
            status='SUCCESS',
            data=data,
            confidence=dec_res.confidence,
            recommended_action=recommended_action,
            models_used=["TransportCostModel", "ETAPredictionModel", "VehicleMatchingModel"],
            reasoning_summary=dec_res.explanation_summary,
        )
