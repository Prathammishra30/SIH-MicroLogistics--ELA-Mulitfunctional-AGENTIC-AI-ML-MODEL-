# Prediction Agent (Phase 9 ML & Neural Intelligence Interface)
# Acts as the dedicated predictive engine interface for all other agents under ELA.
from typing import Dict, Any, List, Optional
import numpy as np

from ai.ela.agents.base import BaseSpecializedAgent
from ai.ela.agents.contracts import AgentRequest, AgentResponse
from ai.ela.learning.registry import ModelRegistry
from ai.ela.learning.trace_store import PredictionTraceStore
from ai.ela.ml.models.demand import DemandPredictionModel, DemandFeatures
from ai.ela.ml.models.price import PricePredictionModel, PriceFeatures
from ai.ela.ml.models.eta import ETAPredictionModel, EtaFeatures
from ai.ela.ml.models.transport import TransportCostModel, TransportCostFeatures
from ai.ela.ml.models.matching import VehicleMatchingModel, VehicleMatchingFeatures
from ai.ela.ml.models.risk import (
    DelayProbabilityModel,
    DelayRiskFeatures,
    CancellationProbabilityModel,
    CancellationRiskFeatures,
    DeliverySuccessProbabilityModel,
    DeliverySuccessFeatures,
)
from ai.ela.neural.models import NeuralFeatureTensor, NeuralRouteDelayLearner, NeuralTransporterReliabilityScorer


class PredictionAgent(BaseSpecializedAgent):
    """
    Specialized agent providing ML predictions and Neural inferences across demand, price,
    freight cost, transit ETA, multi-objective vehicle matching, and trip reliability.
    Dynamically uses the active production model from ModelRegistry and logs full prediction traces.
    """

    def __init__(self):
        super().__init__(
            agent_id="PredictionAgent",
            capabilities=[
                "DEMAND_PREDICTION",
                "PRICE_PREDICTION",
                "ETA_PREDICTION",
                "TRANSPORT_COST_PREDICTION",
                "VEHICLE_MATCHING",
                "RISK_PREDICTION",
                "NEURAL_INFERENCE",
            ],
            allowed_roles=['GUEST', 'FARMER', 'BUYER', 'TRANSPORTER'],
            allowed_tools=[],
            dependencies=[],
        )
        ModelRegistry.ensure_defaults()
        # Neural Learners
        self.neural_delay_learner = NeuralRouteDelayLearner()
        self.neural_reliability_scorer = NeuralTransporterReliabilityScorer()

    def _get_model(self, model_name: str, fallback_cls: Any) -> Any:
        active = ModelRegistry.get_active_model(model_name)
        if active is None:
            active = fallback_cls()
            ModelRegistry.register_model(active, status="production")
        return active

    async def execute(self, request: AgentRequest) -> AgentResponse:
        entities = request.entities
        params = request.parameters
        session_id = getattr(request, "session_id", "default-session")
        commodity = entities.product or entities.commodity or params.get("commodity", "Tomatoes")
        weight_kg = float(entities.quantity or params.get("weight_kg", 500.0))
        origin = entities.pickup_location or params.get("origin", "Nashik")
        dest = entities.destination or params.get("destination", "Pune APMC Mandi")
        grade = entities.grade or params.get("grade", "A")
        v_type = entities.vehicle_type or params.get("vehicle_type", "Mini Truck (750 kg)")

        distance_km = 210.0 if ("nashik" in origin.lower() and "pune" in dest.lower()) else 85.0
        route_str = f"{origin}-{dest}"

        predictions: Dict[str, Any] = {}
        prediction_traces: Dict[str, str] = {}
        models_used: List[str] = []
        confidences: List[float] = []

        # Dynamically fetch active production models from registry
        cost_model = self._get_model("TransportCostModel", TransportCostModel)
        eta_model = self._get_model("ETAPredictionModel", ETAPredictionModel)
        demand_model = self._get_model("DemandPredictionModel", DemandPredictionModel)
        price_model = self._get_model("PricePredictionModel", PricePredictionModel)
        matching_model = self._get_model("VehicleMatchingModel", VehicleMatchingModel)

        # 1. Transport Logistics & Cost Predictions
        if request.intent in ['CREATE_LOGISTICS_WORKFLOW', 'MOVE_PRODUCE', 'GET_FARMER_DELIVERIES', 'GET_VEHICLES']:
            cost_feat = TransportCostFeatures(distance_km=distance_km, weight_kg=weight_kg, vehicle_type=v_type)
            cost_res = await cost_model.predict(cost_feat)
            
            eta_feat = EtaFeatures(origin=origin, destination=dest, distance_km=distance_km, vehicle_type=v_type, departure_hour=8)
            eta_res = await eta_model.predict(eta_feat)

            cost_trace = PredictionTraceStore.record_prediction(
                session_id=session_id,
                model_name="TransportCostModel",
                model_version=cost_model.current_version,
                prediction_type="TRANSPORT_COST",
                input_features=cost_feat.model_dump(),
                predicted_value=cost_res.prediction.estimated_cost,
                confidence=cost_res.confidence,
                route_context=route_str,
                entity_identifiers={"commodity": commodity, "weight_kg": weight_kg},
            )

            eta_trace = PredictionTraceStore.record_prediction(
                session_id=session_id,
                model_name="ETAPredictionModel",
                model_version=eta_model.current_version,
                prediction_type="ETA_MINUTES",
                input_features=eta_feat.model_dump(),
                predicted_value=float(eta_res.prediction.estimated_duration_minutes),
                confidence=eta_res.confidence,
                route_context=route_str,
                entity_identifiers={"commodity": commodity, "vehicle_type": v_type},
            )

            predictions["estimated_cost"] = cost_res.prediction.estimated_cost
            predictions["estimated_duration_minutes"] = eta_res.prediction.estimated_duration_minutes
            predictions["formatted_duration"] = eta_res.prediction.formatted_duration
            predictions["cost_breakdown"] = cost_res.prediction.breakdown
            predictions["eta_model_version"] = eta_model.current_version
            predictions["cost_model_version"] = cost_model.current_version
            
            prediction_traces["TRANSPORT_COST"] = cost_trace.prediction_id
            prediction_traces["ETA_MINUTES"] = eta_trace.prediction_id

            models_used.extend([f"TransportCostModel ({cost_model.current_version})", f"ETAPredictionModel ({eta_model.current_version})"])
            confidences.extend([cost_res.confidence, eta_res.confidence])

            # Neural Route Delay inference
            tensor = NeuralFeatureTensor(np.array([[distance_km, 8.0, 2.0, 30.0, 2.0, 0.35]], dtype=np.float32))
            neural_delay = self.neural_delay_learner.predict(tensor)
            neural_rel = self.neural_reliability_scorer.score_reliability(
                completion_rate=0.98, punctuality_score=0.94, maintenance_score=0.92, rating=4.8
            )
            predictions["neural_corridor_delay_mins"] = round(neural_delay, 1)
            predictions["neural_transporter_reliability"] = neural_rel
            models_used.extend(["NeuralRouteDelayLearner", "NeuralTransporterReliabilityScorer"])

        # 2. Market & Price Predictions
        if request.intent in ['GET_MARKET_DEMAND', 'GET_PRICE_FORECAST', 'CREATE_PRODUCT_WORKFLOW', 'CREATE_PROCUREMENT_WORKFLOW']:
            demand_feat = DemandFeatures(commodity=commodity, mandi=dest)
            demand_res = await demand_model.predict(demand_feat)
            
            price_feat = PriceFeatures(commodity=commodity, grade=grade, mandi_location=dest)
            price_res = await price_model.predict(price_feat)

            demand_trace = PredictionTraceStore.record_prediction(
                session_id=session_id,
                model_name="DemandPredictionModel",
                model_version=demand_model.current_version,
                prediction_type="DEMAND_KG",
                input_features=demand_feat.model_dump(),
                predicted_value=float(demand_res.prediction.expected_weekly_demand_tonnes * 1000.0),
                confidence=demand_res.confidence,
                route_context=dest,
                entity_identifiers={"commodity": commodity},
            )

            price_trace = PredictionTraceStore.record_prediction(
                session_id=session_id,
                model_name="PricePredictionModel",
                model_version=price_model.current_version,
                prediction_type="SPOT_PRICE",
                input_features=price_feat.model_dump(),
                predicted_value=float(price_res.prediction.expected_modal_price),
                confidence=price_res.confidence,
                route_context=dest,
                entity_identifiers={"commodity": commodity, "grade": grade},
            )

            predictions["demand"] = demand_res.prediction.model_dump()
            predictions["price"] = price_res.prediction.model_dump()
            prediction_traces["DEMAND_KG"] = demand_trace.prediction_id
            prediction_traces["SPOT_PRICE"] = price_trace.prediction_id

            models_used.extend([f"DemandPredictionModel ({demand_model.current_version})", f"PricePredictionModel ({price_model.current_version})"])
            confidences.extend([demand_res.confidence, price_res.confidence])

        # 3. Vehicle Matching Predictions
        avail_vehicles = params.get("available_vehicles", [])
        if avail_vehicles:
            match_feat = VehicleMatchingFeatures(cargo_weight_kg=weight_kg, available_vehicles=avail_vehicles)
            match_res = await matching_model.predict(match_feat)
            predictions["vehicle_matching"] = match_res.prediction.model_dump()
            models_used.append(f"VehicleMatchingModel ({matching_model.current_version})")
            confidences.append(match_res.confidence)

        predictions["prediction_traces"] = prediction_traces
        avg_conf = sum(confidences) / len(confidences) if confidences else 0.90

        return AgentResponse(
            agent_id=self.agent_id,
            task_id=request.task_id,
            status='SUCCESS',
            data=predictions,
            confidence=round(avg_conf, 2),
            models_used=models_used,
            reasoning_summary=f"Synthesized predictive ML and Neural inference using {len(models_used)} active production models with {avg_conf * 100:.1f}% confidence.",
        )
