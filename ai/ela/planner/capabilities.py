# ELA Specialized Agent & Tool Capability Registry (Phase 12.3)
from typing import Dict, Any, List, Optional, Tuple
from ai.ela.tools.registry import ToolRegistry


class AgentCapabilityRegistry:
    """
    Authoritative capability lookup mapping plan steps to existing specialized agents.
    Prevents hallucinating nonexistent capabilities or anonymous plan steps.
    """
    AGENT_CAPABILITIES: Dict[str, List[str]] = {
        'FarmerAgent': [
            'get_farmer_products',
            'create_product',
            'get_farmer_deliveries',
            'validate_shipment_details',
            'stage_farmer_recommendation',
        ],
        'BuyerAgent': [
            'get_buyer_produce',
            'create_procurement',
            'get_buyer_orders',
            'validate_procurement_demand',
        ],
        'TransporterAgent': [
            'get_available_trips',
            'get_active_trips',
            'get_vehicles',
            'create_vehicle',
            'get_earnings',
            'validate_transporter_bid',
        ],
        'LogisticsAgent': [
            'create_logistics_request',
            'match_vehicles',
            'rank_transport_options',
            'stage_booking_card',
        ],
        'PredictionAgent': [
            'predict_eta_cost',
            'predict_tariff',
            'predict_transit_eta',
            'predict_market_demand',
        ],
        'RiskAgent': [
            'assess_route_delay_risk',
            'assess_cancellation_risk',
            'evaluate_spoilage_risk',
        ],
        'MarketAgent': [
            'get_market_demand',
            'get_mandi_prices',
            'forecast_price_trends',
        ],
    }

    @classmethod
    def has_agent(cls, agent_name: str) -> bool:
        return agent_name in cls.AGENT_CAPABILITIES

    @classmethod
    def get_agent_for_capability(cls, capability: str) -> Optional[str]:
        for agent, caps in cls.AGENT_CAPABILITIES.items():
            if capability in caps:
                return agent
        return None

    @classmethod
    def validate_step_capability(cls, owner_agent: str, required_tools: List[str]) -> Tuple[bool, Optional[str]]:
        """
        Verifies that owner_agent exists and that all required_tools are recognized in ToolRegistry.
        """
        if not cls.has_agent(owner_agent):
            return False, f"Unknown agent '{owner_agent}'"

        for tool in required_tools:
            # Check ToolRegistry for registered tools
            if not ToolRegistry.get_tool(tool) and tool not in cls.AGENT_CAPABILITIES.get(owner_agent, []):
                return False, f"Tool '{tool}' not registered for agent '{owner_agent}'"

        return True, None
