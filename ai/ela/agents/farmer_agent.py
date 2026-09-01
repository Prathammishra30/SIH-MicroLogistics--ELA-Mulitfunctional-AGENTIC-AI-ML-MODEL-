# Farmer Agent (Phase 9 Farmer Domain Intelligence Specialist)
from typing import Dict, Any, List
from ai.ela.agents.base import BaseSpecializedAgent
from ai.ela.agents.contracts import AgentRequest, AgentResponse


class FarmerAgent(BaseSpecializedAgent):
    """
    Specialized domain agent for farmer workflows: listing produce inventory, harvest logistics booking,
    and active delivery tracking.
    """

    def __init__(self):
        super().__init__(
            agent_id="FarmerAgent",
            capabilities=[
                "FARMER_INVENTORY_MANAGEMENT",
                "CROP_LISTING",
                "FARMER_DELIVERY_TRACKING",
                "HARVEST_LOGISTICS_STAGING",
            ],
            allowed_roles=['GUEST', 'FARMER'],
            allowed_tools=['create_product', 'get_farmer_products', 'get_farmer_deliveries'],
            dependencies=[],
        )

    async def execute(self, request: AgentRequest) -> AgentResponse:
        entities = request.entities
        params = request.parameters
        intent = request.intent
        prod = entities.product or entities.commodity or params.get("product", "Tomatoes")
        qty = float(entities.quantity or params.get("quantity", 500.0))
        price = float(entities.price_per_unit or params.get("price_per_unit", 25.0))
        unit = entities.unit or params.get("unit", "kg")

        recommended_action = None
        data: Dict[str, Any] = {}
        summary = ""

        if intent in ['CREATE_PRODUCT_WORKFLOW', 'ADD_PRODUCT']:
            recommended_action = {
                "toolName": "create_product",
                "actionType": "STAGED_MUTATION",
                "params": {
                    "productName": prod,
                    "quantity": qty,
                    "unit": unit,
                    "pricePerUnit": price,
                    "category": "VEGETABLES",
                },
            }
            data = {"product": prod, "quantity": qty, "price_per_unit": price, "unit": unit}
            summary = f"Staged addition of **{prod}** ({qty:.0f} {unit}) at ₹{price:.2f}/{unit} to farm inventory."

        elif intent in ['GET_FARMER_PRODUCTS', 'LIST_PRODUCTS']:
            recommended_action = {
                "toolName": "get_farmer_products",
                "actionType": "READ_TOOL",
                "params": {"userId": request.parameters.get("userId", "default-farmer")},
            }
            summary = "Retrieved farm inventory catalog and active listed produce."

        elif intent in ['GET_FARMER_DELIVERIES', 'TRACK_DELIVERY']:
            recommended_action = {
                "toolName": "get_farmer_deliveries",
                "actionType": "READ_TOOL",
                "params": {"userId": request.parameters.get("userId", "default-farmer")},
            }
            summary = "Retrieved active shipments and real-time delivery tracking status."

        else:
            summary = f"Farmer agent prepared domain context for {prod} ({qty:.0f} kg)."
            data = {"product": prod, "quantity": qty}

        return AgentResponse(
            agent_id=self.agent_id,
            task_id=request.task_id,
            status='SUCCESS',
            data=data,
            confidence=0.95,
            recommended_action=recommended_action,
            reasoning_summary=summary,
        )
