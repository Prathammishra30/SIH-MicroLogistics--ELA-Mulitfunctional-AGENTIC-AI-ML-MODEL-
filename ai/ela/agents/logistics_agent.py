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

        # Cross-Role Triple Match Orchestration (Phase 12.5)
        from ai.ela.orchestration.service import MatchOrchestrationService
        from ai.ela.orchestration.matching import FarmerListing, BuyerProcurement, TransporterCapacity
        from datetime import date, timedelta

        match_service = MatchOrchestrationService()
        proposals = []
        orchestration_error = None
        try:
            if request.role == 'BUYER':
                buyer_req = BuyerProcurement(
                    buyer_id=params.get("userId", "buyer-user"),
                    crop_needed=commodity,
                    quantity_needed_kg=weight_kg,
                    budget_per_kg=float(params.get("target_price", 40.0)),
                    min_quality_grade="A",
                    delivery_lat=18.5204,
                    delivery_lon=73.8567,
                    needed_by=date.today() + timedelta(days=3),
                )
                proposals = match_service.match_buyer_procurement(buyer_req)
            elif request.role == 'TRANSPORTER':
                trans_cap = TransporterCapacity(
                    transporter_id=params.get("userId", "transporter-user"),
                    vehicle_type=entities.vehicle_type or "Truck",
                    capacity_kg=weight_kg if weight_kg > 500 else 2000.0,
                    has_refrigeration=False,
                    base_lat=18.5204,
                    base_lon=73.8567,
                    max_radius_km=150.0,
                )
                proposals = match_service.match_transporter_capacity(trans_cap)
            else:
                farmer_listing = FarmerListing(
                    farmer_id=params.get("userId", "farmer-user"),
                    crop=commodity,
                    quantity_kg=weight_kg,
                    asking_price_per_kg=32.0,
                    quality_grade="A",
                    pickup_lat=19.9975,
                    pickup_lon=73.7898,
                    harvest_date=date.today(),
                )
                proposals = match_service.match_farmer_produce(farmer_listing)
        except Exception as e:
            orchestration_error = str(e)

        top_prop = proposals[0] if proposals else None

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
                "proposalId": top_prop.id if top_prop else None,
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

        if top_prop:
            data["match_proposal"] = {
                "id": top_prop.id,
                "crop": top_prop.crop,
                "quantity_kg": top_prop.quantity_kg,
                "match_score": top_prop.match_score,
                "sub_scores": top_prop.sub_scores,
                "status": top_prop.status.value,
                "farmer_id": top_prop.farmer_id,
                "buyer_id": top_prop.buyer_id,
                "transporter_id": top_prop.transporter_id,
                "explanation": top_prop.explanation,
                "proposed_price": top_prop.asking_price_per_kg,
                "transport_cost": top_prop.transport_cost_per_kg,
                "total_cost": top_prop.total_cost_per_kg,
            }
            data["candidate_proposals_count"] = len(proposals)
            data["orchestration_invoked"] = True
        elif orchestration_error:
            data["orchestration_error"] = orchestration_error

        models = ["TransportCostModel", "ETAPredictionModel", "VehicleMatchingModel"]
        if top_prop:
            models.append("CrossRoleMatchEngine")

        summary = top_prop.explanation if top_prop else dec_res.explanation_summary

        return AgentResponse(
            agent_id=self.agent_id,
            task_id=request.task_id,
            status='SUCCESS',
            data=data,
            confidence=dec_res.confidence,
            recommended_action=recommended_action,
            models_used=models,
            reasoning_summary=summary,
        )
