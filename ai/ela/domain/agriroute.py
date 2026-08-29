# AgriRoute Domain Adapter Implementation (Phase 5 Core Intelligence Fusion)
from typing import Dict, Any, List, Optional, Tuple
from ai.ela.domain.adapter import DomainAdapter, DomainContext
from ai.ela.knowledge.engine import KnowledgeEngine


class AgriRouteDomainAdapter(DomainAdapter):
    """
    Concrete adapter for AgriRoute Agricultural Micro-Logistics Platform.
    """
    def __init__(self):
        self.knowledge = KnowledgeEngine()
        self._context = DomainContext(
            domain_id="agriroute-micro-logistics",
            domain_name="AgriRoute Rural Logistics & APMC Mandi Network",
            supported_roles=["FARMER", "BUYER", "TRANSPORTER", "GUEST"],
            supported_intents=[
                "MOVE_PRODUCE", "CREATE_LOGISTICS_WORKFLOW", "CREATE_PRODUCT_WORKFLOW",
                "POST_PROCUREMENT", "ADD_VEHICLE", "GET_MARKET_DEMAND",
                "GET_FARMER_PRODUCTS", "GET_FARMER_DELIVERIES", "GET_BUYER_PRODUCE",
                "GET_BUYER_ORDERS", "GET_AVAILABLE_TRIPS", "GET_VEHICLES", "GET_EARNINGS",
                "ROLE_DECLARATION", "EXPLAIN_PLATFORM", "LOGIN_REDIRECT",
            ],
            primary_entities=["commodity", "quantity", "pickup_location", "destination", "vehicle_type", "price"],
        )

    @property
    def context(self) -> DomainContext:
        return self._context

    def validate_entities(self, entities: Dict[str, Any]) -> Tuple[bool, List[str]]:
        warnings = []
        weight = float(entities.get("quantity", 0) or 0)
        if weight > 25000.0:
            warnings.append(f"Quantity ({weight} kg) exceeds single-vehicle payload limits.")

        comm = entities.get("commodity") or entities.get("product")
        if comm:
            c_fact = self.knowledge.get_commodity_info(comm)
            if not c_fact:
                warnings.append(f"Commodity '{comm}' not in standard APMC catalog.")

        return len(warnings) == 0, warnings

    def get_system_prompt_rules(self, role: str, language: str) -> str:
        return (
            f"You are ELA operating in the AgriRoute domain. "
            f"Current conversational context: {role}. Language: {language}. "
            f"Never fabricate APMC mandi prices. Use decision support rankings for transport planning. "
            f"Always require explicit confirmation before staging database mutations."
        )
