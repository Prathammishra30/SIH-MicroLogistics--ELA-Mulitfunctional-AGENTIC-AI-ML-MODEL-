# Buyer Agent (Phase 9 Buyer Domain Intelligence Specialist)
from typing import Dict, Any, List
from ai.ela.agents.base import BaseSpecializedAgent
from ai.ela.agents.contracts import AgentRequest, AgentResponse


class BuyerAgent(BaseSpecializedAgent):
    """
    Specialized domain agent for buyer workflows: fresh produce discovery, procurement order staging,
    and purchase order tracking.
    """

    def __init__(self):
        super().__init__(
            agent_id="BuyerAgent",
            capabilities=[
                "BUYER_PROCUREMENT",
                "PRODUCE_DISCOVERY",
                "ORDER_TRACKING",
                "SUPPLIER_EVALUATION",
            ],
            allowed_roles=['GUEST', 'BUYER'],
            allowed_tools=['create_procurement', 'get_buyer_produce', 'get_buyer_orders'],
            dependencies=[],
        )

    async def execute(self, request: AgentRequest) -> AgentResponse:
        entities = request.entities
        params = request.parameters
        intent = request.intent
        prod = entities.product or entities.commodity or params.get("product", "Tomatoes")
        qty = float(entities.quantity or params.get("quantity", 2000.0))
        target_price = float(entities.price_per_unit or params.get("target_price", 28.0))
        dest = entities.destination or params.get("destination", "Pune APMC Mandi")

        recommended_action = None
        data: Dict[str, Any] = {}
        summary = ""

        if intent in ['CREATE_PROCUREMENT_WORKFLOW', 'BUY_PRODUCE']:
            # Cross-Role Triple Match Orchestration (Phase 12.5)
            from ai.ela.orchestration.service import MatchOrchestrationService
            from ai.ela.orchestration.matching import BuyerProcurement
            from datetime import date, timedelta

            match_service = MatchOrchestrationService()
            proposals = []
            try:
                buyer_req = BuyerProcurement(
                    id=f"buy-{params.get('userId', 'buyer-user')}",
                    buyer_id=params.get("userId", "buyer-user"),
                    crop_needed=prod,
                    quantity_needed_kg=qty,
                    budget_per_kg=target_price,
                    min_quality_grade=1,
                    lat=18.5204,
                    lon=73.8567,
                    needed_by=date.today() + timedelta(days=3),
                )
                proposals = match_service.match_buyer_procurement(buyer_req)
            except Exception:
                pass

            top_prop = proposals[0] if proposals else None

            recommended_action = {
                "toolName": "create_procurement",
                "actionType": "STAGED_MUTATION",
                "params": {
                    "cropName": prod,
                    "quantity": qty,
                    "targetPrice": target_price,
                    "deliveryLocation": dest,
                    "proposalId": top_prop.id if top_prop else None,
                },
            }
            data = {"cropName": prod, "quantity": qty, "targetPrice": target_price, "destination": dest}
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
                summary = f"Staged procurement order for **{prod}** ({qty:.0f} kg) at target rate ₹{target_price:.2f}/kg to {dest}."

        elif intent in ['GET_BUYER_PRODUCE', 'BROWSE_PRODUCE']:
            recommended_action = {
                "toolName": "get_buyer_produce",
                "actionType": "READ_TOOL",
                "params": {"category": "ALL"},
            }
            summary = "Retrieved verified farm produce catalog and active farmer listings."

        elif intent in ['GET_BUYER_ORDERS', 'TRACK_ORDERS']:
            recommended_action = {
                "toolName": "get_buyer_orders",
                "actionType": "READ_TOOL",
                "params": {"userId": request.parameters.get("userId", "default-buyer")},
            }
            summary = "Retrieved buyer procurement orders and fulfilment statuses."

        else:
            summary = f"Buyer agent prepared procurement context for {prod} ({qty:.0f} kg)."
            data = {"cropName": prod, "quantity": qty}

        return AgentResponse(
            agent_id=self.agent_id,
            task_id=request.task_id,
            status='SUCCESS',
            data=data,
            confidence=0.95,
            recommended_action=recommended_action,
            reasoning_summary=summary,
        )
