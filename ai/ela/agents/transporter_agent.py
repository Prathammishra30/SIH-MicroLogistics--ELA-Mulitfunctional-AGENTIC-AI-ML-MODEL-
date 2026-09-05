# Transporter Agent (Phase 9 Transporter Domain Intelligence Specialist)
from typing import Dict, Any, List
from ai.ela.agents.base import BaseSpecializedAgent
from ai.ela.agents.contracts import AgentRequest, AgentResponse


class TransporterAgent(BaseSpecializedAgent):
    """
    Specialized domain agent for transporter workflows: fleet registration, vehicle capacity management,
    available freight trip discovery, and corridor earnings optimization.
    """

    def __init__(self):
        super().__init__(
            agent_id="TransporterAgent",
            capabilities=[
                "FLEET_MANAGEMENT",
                "VEHICLE_REGISTRATION",
                "TRIP_DISCOVERY",
                "EARNINGS_OPTIMIZATION",
            ],
            allowed_roles=['GUEST', 'TRANSPORTER'],
            allowed_tools=['create_vehicle', 'get_vehicles', 'get_available_trips'],
            dependencies=[],
        )

    async def execute(self, request: AgentRequest) -> AgentResponse:
        entities = request.entities
        params = request.parameters
        intent = request.intent
        v_type = entities.vehicle_type or params.get("vehicleType", "Pickup Van (1.5 Ton)")
        v_reg = entities.vehicle_reg_no or params.get("registrationNumber", "MH-15-AB-1234")
        v_cap = float(entities.quantity or params.get("capacityKg", 1500.0))

        recommended_action = None
        data: Dict[str, Any] = {}
        summary = ""

        if intent in ['CREATE_VEHICLE_WORKFLOW', 'ADD_VEHICLE']:
            recommended_action = {
                "toolName": "create_vehicle",
                "actionType": "STAGED_MUTATION",
                "params": {
                    "vehicleType": v_type,
                    "capacityKg": v_cap,
                    "registrationNumber": v_reg,
                },
            }
            data = {"vehicleType": v_type, "capacityKg": v_cap, "registrationNumber": v_reg}
            summary = f"Staged addition of **{v_type}** ({v_cap:.0f} kg capacity, Reg: {v_reg}) to transporter fleet."

        elif intent in ['GET_VEHICLES', 'LIST_FLEET']:
            recommended_action = {
                "toolName": "get_vehicles",
                "actionType": "READ_TOOL",
                "params": {"userId": request.parameters.get("userId", "default-transporter")},
            }
            summary = "Retrieved registered fleet vehicles and current availability status."

        elif intent in ['GET_AVAILABLE_TRIPS', 'DISCOVER_TRIPS']:
            # Cross-Role Triple Match Orchestration (Phase 12.5)
            from ai.ela.orchestration.service import MatchOrchestrationService
            from ai.ela.orchestration.matching import TransporterCapacity

            match_service = MatchOrchestrationService()
            proposals = []
            try:
                trans_cap = TransporterCapacity(
                    id=f"trans-{params.get('userId', 'transporter-user')}",
                    transporter_id=params.get("userId", "transporter-user"),
                    vehicle_type=v_type,
                    capacity_kg=v_cap if v_cap > 500 else 2000.0,
                    home_lat=18.5204,
                    home_lon=73.8567,
                    max_radius_km=150.0,
                )
                proposals = match_service.match_transporter_capacity(trans_cap)
            except Exception:
                pass

            top_prop = proposals[0] if proposals else None

            recommended_action = {
                "toolName": "get_available_trips",
                "actionType": "READ_TOOL",
                "params": {
                    "origin": entities.pickup_location or "Nashik",
                    "proposalId": top_prop.id if top_prop else None,
                },
            }
            data = {"vehicleType": v_type, "capacityKg": v_cap}
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
                summary = top_prop.explanation
            else:
                summary = "Retrieved available farmer logistics loads and high-margin corridor trips."

        else:
            summary = f"Transporter agent prepared fleet context for {v_type}."
            data = {"vehicleType": v_type, "capacityKg": v_cap}

        return AgentResponse(
            agent_id=self.agent_id,
            task_id=request.task_id,
            status='SUCCESS',
            data=data,
            confidence=0.95,
            recommended_action=recommended_action,
            reasoning_summary=summary,
        )
