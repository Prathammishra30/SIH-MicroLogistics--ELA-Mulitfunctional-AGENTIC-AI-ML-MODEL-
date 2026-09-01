# Market Agent (Phase 9 APMC Price Discovery & Crop Demand Intelligence)
from typing import Dict, Any, List
from ai.ela.agents.base import BaseSpecializedAgent
from ai.ela.agents.contracts import AgentRequest, AgentResponse
from ai.ela.ml.models.demand import DemandPredictionModel, DemandFeatures
from ai.ela.ml.models.price import PricePredictionModel, PriceFeatures
from ai.ela.knowledge.engine import KnowledgeEngine


class MarketAgent(BaseSpecializedAgent):
    """
    Specialized agent for APMC Mandi price discovery, crop demand trends, and perishable commodity urgency.
    """

    def __init__(self):
        super().__init__(
            agent_id="MarketAgent",
            capabilities=[
                "MARKET_DEMAND_ANALYSIS",
                "SPOT_PRICE_DISCOVERY",
                "PRICE_TREND_FORECASTING",
                "COMMODITY_PERISHABILITY_CHECK",
                "APMC_OPPORTUNITIES",
            ],
            allowed_roles=['GUEST', 'FARMER', 'BUYER'],
            allowed_tools=['get_market_demand', 'get_price_forecast'],
            dependencies=[],
        )
        self.demand_model = DemandPredictionModel()
        self.price_model = PricePredictionModel()
        self.knowledge = KnowledgeEngine()

    async def execute(self, request: AgentRequest) -> AgentResponse:
        entities = request.entities
        params = request.parameters
        commodity = entities.product or entities.commodity or params.get("commodity", "Tomatoes")
        grade = entities.grade or params.get("grade", "A")
        mandi = entities.destination or params.get("mandi", "Pune APMC Mandi")

        # 1. Price Prediction
        price_res = await self.price_model.predict(
            PriceFeatures(commodity=commodity, grade=grade, mandi_location=mandi)
        )
        # 2. Demand Prediction
        demand_res = await self.demand_model.predict(
            DemandFeatures(commodity=commodity, mandi=mandi)
        )
        # 3. Domain Knowledge & Perishability
        c_fact = self.knowledge.get_commodity_info(commodity)
        is_perish_urgent, perish_note = self.knowledge.check_perishability_urgency(commodity, 4.0)

        market_data = {
            "commodity": commodity,
            "grade": grade,
            "mandi": mandi,
            "predicted_avg_price_per_kg": price_res.prediction.predicted_avg_price,
            "price_range": price_res.prediction.price_range,
            "price_trend": price_res.prediction.trend,
            "demand_level": demand_res.prediction.demand_level,
            "growth_rate_pct": demand_res.prediction.growth_rate_pct,
            "perishability": {
                "shelf_life_days": c_fact.shelf_life_days if c_fact else 5,
                "is_urgent": is_perish_urgent,
                "handling_note": perish_note,
            },
            "mandi_recommendation": f"Optimal mandi for {commodity} is {mandi} with high liquidity.",
        }

        avg_conf = min(price_res.confidence, demand_res.confidence)
        summary = (
            f"Mandi spot rate for {commodity} (Grade {grade}) at {mandi}: ₹{price_res.prediction.predicted_avg_price:.2f}/kg "
            f"({price_res.prediction.trend} trend). Demand is {demand_res.prediction.demand_level}."
        )

        return AgentResponse(
            agent_id=self.agent_id,
            task_id=request.task_id,
            status='SUCCESS',
            data=market_data,
            confidence=round(avg_conf, 2),
            models_used=["PricePredictionModel", "DemandPredictionModel"],
            reasoning_summary=summary,
        )
