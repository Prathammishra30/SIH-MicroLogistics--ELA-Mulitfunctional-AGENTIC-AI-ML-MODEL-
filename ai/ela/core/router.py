# Intelligence Router (Phase 5 Core Intelligence Fusion)
# Dynamically routes user intent and context to the optimal subset of ELA intelligence engines.
from typing import List, Dict, Any, Literal
from pydantic import BaseModel, Field
from ai.ela.agent.state import ElaIntent, UserRole


EngineType = Literal[
    'LLM',
    'AGENT',
    'TOOL',
    'DEMAND_ML',
    'PRICE_ML',
    'ETA_ML',
    'COST_ML',
    'MATCH_ML',
    'NEURAL',
    'KNOWLEDGE',
    'DECISION_ENGINE',
    'LEARNING',
]


class RoutingDecision(BaseModel):
    intent: ElaIntent
    active_role: UserRole
    required_engines: List[EngineType]
    specialists_needed: List[str]
    routing_rationale: str


class IntelligenceRouter:
    """
    Intelligent Capability Router: Avoids invoking every engine for every turn.
    Selects the exact intelligence configuration needed for the current goal.
    """
    @staticmethod
    def route(intent: ElaIntent, role: UserRole, entities: Any, raw_message: str) -> RoutingDecision:
        engines: List[EngineType] = ['LLM']
        specialists: List[str] = []
        rationale: str = "Standard conversational response."

        if intent in ['MOVE_PRODUCE', 'CREATE_LOGISTICS_WORKFLOW']:
            engines.extend(['AGENT', 'MATCH_ML', 'ETA_ML', 'COST_ML', 'KNOWLEDGE', 'DECISION_ENGINE', 'TOOL'])
            specialists.extend(['LogisticsAgent', 'FleetAgent'])
            rationale = "Transport booking workflow requires fleet matching ML, transit ETA ML, freight tariff ML, and multi-objective decision synthesis."

        elif intent in ['GET_MARKET_DEMAND', 'GET_PRICE_FORECAST']:
            engines.extend(['DEMAND_ML', 'PRICE_ML', 'KNOWLEDGE', 'DECISION_ENGINE'])
            specialists.append('MarketAgent')
            rationale = "Market price/demand discovery requires APMC price regression ML, arrival volume elasticity, and mandi knowledge."

        elif intent in ['CREATE_PRODUCT_WORKFLOW', 'POST_PROCUREMENT', 'ADD_VEHICLE']:
            engines.extend(['AGENT', 'KNOWLEDGE', 'TOOL'])
            rationale = "Consequential resource staging requires goal validation, entity normalization, and confirmation staging."

        elif intent in [
            'GET_FARMER_PRODUCTS', 'GET_FARMER_DELIVERIES', 'GET_BUYER_PRODUCE',
            'GET_BUYER_ORDERS', 'GET_AVAILABLE_TRIPS', 'GET_VEHICLES', 'GET_EARNINGS'
        ]:
            engines.extend(['AGENT', 'TOOL'])
            rationale = "Database query operation requires tool execution bridge through authoritative backend."

        elif intent in ['RECORD_FEEDBACK', 'REPORT_TRIP_OUTCOME']:
            engines.extend(['LEARNING', 'NEURAL'])
            specialists.append('LearningAgent')
            rationale = "Trip outcome requires error delta calculation, pattern mining, and candidate model evaluation."

        return RoutingDecision(
            intent=intent,
            active_role=role,
            required_engines=engines,
            specialists_needed=specialists,
            routing_rationale=rationale,
        )
