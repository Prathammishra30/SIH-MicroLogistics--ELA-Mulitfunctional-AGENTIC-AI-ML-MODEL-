# ELA Universal Intelligence Fusion Engine (Phase 6 Universal Intelligence Fusion)
# Central Python Intelligence Core fusing LLM Reasoning, Trained ML Models, Neural Learned Patterns,
# 3-Tier Memory, Goal Planning, Decision Intelligence, and Governed Continuous Learning.
import time
import math
import numpy as np
from typing import Dict, Any, Optional, List, Union
from pydantic import BaseModel, Field
from datetime import datetime

# Domain & State
from ai.ela.agent.state import (
    ElaAgentState,
    AgentExecutionTrace,
    ConfidenceScore,
    StepObservation,
    UserRole,
    SupportedLanguage,
    ElaIntent,
    AgentOutcome,
    GoalPlan,
    SubTask,
    CanonicalEntities,
)
from ai.ela.agent.loop import AgentChatRequest, AgentChatResponse
from ai.ela.intent.resolver import IntentResolver
from ai.ela.security.guard import SecurityGuard
from ai.ela.memory.session import ConversationMemory, UserMemory, PrivacySanitizer
from ai.ela.agent.confidence import ConfidenceEngine
from ai.ela.planner.planner import AgentPlanner, GoalManager, ExecutionPlan
from ai.ela.domain.agriroute import AgriRouteDomainAdapter
from ai.ela.core.decision_support import DecisionSupportEngine, DecisionSupportResult, DecisionOption
from ai.ela.tools.registry import NodeToolBridge

# Providers & ML Models
from ai.ela.providers.llm import LLMProvider, ProductionLLMAdapter, CanonicalRuleLLMProvider
from ai.ela.neural.provider import DistilledSemanticNeuralProvider, NeuralAnomalyResult
from ai.ela.neural.models import NeuralFeatureTensor, NeuralRouteDelayLearner, NeuralTransporterReliabilityScorer
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
from ai.ela.learning.error_analysis import ErrorAnalysisEngine
from ai.ela.learning.collector import FeedbackCollector
from ai.ela.learning.evaluator import ModelRegistry


class StructuredIntelligenceDecision(BaseModel):
    """
    Standardized Output of the ELA Intelligence Fusion Engine.
    Conforms to Phase 6 Master Project Directive.
    """
    intent: str
    role: str
    language: str
    entities: Dict[str, Any]
    goal: Optional[Dict[str, Any]] = None
    predictions: Dict[str, Any] = Field(default_factory=dict)
    neural_insights: Dict[str, Any] = Field(default_factory=dict)
    options: List[Dict[str, Any]] = Field(default_factory=list)
    recommended_action: Optional[Dict[str, Any]] = None
    confidence: float
    reasoning_summary: str
    requires_confirmation: bool
    is_out_of_distribution: bool = False
    calibrated_warning: Optional[str] = None
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())


class IntelligenceFusionEngine:
    """
    ELA Universal Brain & Master Intelligence Orchestrator.
    Combines LLM Cognitive Reasoning, ML Predictive Engines, Neural Pattern Models,
    Decision Intelligence, Goal Planning, and Governed Continuous Learning.
    """
    def __init__(
        self,
        llm_provider: Optional[LLMProvider] = None,
        node_bridge: Optional[NodeToolBridge] = None,
    ):
        # 1. Foundation Providers & Adapters
        self.llm = llm_provider or ProductionLLMAdapter()
        self.node_bridge = node_bridge or NodeToolBridge()
        self.domain_adapter = AgriRouteDomainAdapter()
        
        # 2. Neural Intelligence Subsystems
        self.neural_embedder = DistilledSemanticNeuralProvider()
        self.neural_delay_learner = NeuralRouteDelayLearner()
        self.neural_reliability_scorer = NeuralTransporterReliabilityScorer()

        # 3. Machine Learning Predictive Subsystems
        self.demand_model = DemandPredictionModel()
        self.price_model = PricePredictionModel()
        self.eta_model = ETAPredictionModel()
        self.cost_model = TransportCostModel()
        self.matching_model = VehicleMatchingModel()
        self.delay_risk_model = DelayProbabilityModel()
        self.cancel_risk_model = CancellationProbabilityModel()
        self.delivery_success_model = DeliverySuccessProbabilityModel()

        # 4. Cognitive Reasoning & Decision Engines
        self.intent_resolver = IntentResolver()
        self.security_guard = SecurityGuard()
        self.confidence_engine = ConfidenceEngine()
        self.decision_support = DecisionSupportEngine()
        self.planner = AgentPlanner()

    @property
    def active_demand_model(self):
        return ModelRegistry.get_active_model("DemandPredictionModel") or self.demand_model

    @property
    def active_price_model(self):
        return ModelRegistry.get_active_model("PricePredictionModel") or self.price_model

    @property
    def active_eta_model(self):
        return ModelRegistry.get_active_model("ETAPredictionModel") or self.eta_model

    @property
    def active_cost_model(self):
        return ModelRegistry.get_active_model("TransportCostModel") or self.cost_model

    @property
    def active_matching_model(self):
        return ModelRegistry.get_active_model("VehicleMatchingModel") or self.matching_model

    @property
    def active_delay_risk_model(self):
        return ModelRegistry.get_active_model("DelayProbabilityModel") or self.delay_risk_model

    @property
    def active_cancel_risk_model(self):
        return ModelRegistry.get_active_model("CancellationProbabilityModel") or self.cancel_risk_model

    @property
    def active_delivery_success_model(self):
        return ModelRegistry.get_active_model("DeliverySuccessProbabilityModel") or self.delivery_success_model

    async def fuse_and_decide(self, request: AgentChatRequest) -> StructuredIntelligenceDecision:
        start_time = time.time()
        session_id = request.session_id or f"session-{int(start_time * 1000)}"
        raw_message = (request.message or "").strip()

        # --------------------------------------------------------------------
        # 1. SECURITY & ZERO-SECRET CREDENTIAL SHIELD
        # --------------------------------------------------------------------
        sec_check = self.security_guard.check_safety(raw_message, request.authenticated_role)
        if not sec_check.is_safe:
            return StructuredIntelligenceDecision(
                intent="SECURITY_ALERT",
                role=request.authenticated_role,
                language=request.language,
                entities={},
                confidence=1.0,
                reasoning_summary="Sensitive credentials or unsafe prompt injection detected. Input shielded.",
                requires_confirmation=False,
            )

        # --------------------------------------------------------------------
        # 2. MULTILINGUAL NLU & SEMANTIC UNDERSTANDING (Original Language)
        # --------------------------------------------------------------------
        canonical = self.intent_resolver.resolve(raw_message, request.authenticated_role, request.language)
        lang = canonical.language
        
        # Dynamic Role Deduction
        effective_role = (
            request.authenticated_role
            if request.authenticated
            else (canonical.target_role if canonical.target_role != "GUEST" else "GUEST")
        )

        # Accumulate memory across turns
        accumulated_entities = ConversationMemory.update_entities(session_id, canonical.entities)
        ConversationMemory.set_last_intent(session_id, canonical.intent)

        # --------------------------------------------------------------------
        # 3. CALIBRATED UNCERTAINTY & CONFIDENCE EVALUATION
        # --------------------------------------------------------------------
        conf_eval = self.confidence_engine.evaluate(
            canonical.intent, accumulated_entities, canonical.confidence, lang, effective_role
        )

        is_ood = conf_eval.needs_clarification or conf_eval.confidence.overall_confidence < 0.45
        calibrated_warning = None
        if is_ood:
            calibrated_warning = "Input contains high semantic variance or out-of-distribution operational parameters."

        # --------------------------------------------------------------------
        # 4. AGENTIC GOAL DECOMPOSITION
        # --------------------------------------------------------------------
        goal = GoalManager.decompose_goal(canonical.intent, accumulated_entities, effective_role, raw_message)
        ConversationMemory.set_active_goal(session_id, goal)

        # --------------------------------------------------------------------
        # 5. PREDICTIVE ML & NEURAL SYNTHESIS
        # --------------------------------------------------------------------
        predictions: Dict[str, Any] = {}
        neural_insights: Dict[str, Any] = {}
        options: List[Dict[str, Any]] = []
        recommended_action: Optional[Dict[str, Any]] = None
        reasoning_summary = "Processed operational context."

        commodity = accumulated_entities.product or "Tomatoes"
        weight_kg = float(accumulated_entities.quantity or 500.0)
        origin = accumulated_entities.pickup_location or "Nashik"
        dest = accumulated_entities.destination or "Pune APMC Mandi"

        if canonical.intent in ["CREATE_LOGISTICS_WORKFLOW", "MOVE_PRODUCE"]:
            # Strategy detection using robust multilingual extractor
            from ai.ela.intent.strategy import StrategyExtractor
            curr_strat = getattr(accumulated_entities, 'strategy', 'BALANCED') or 'BALANCED'
            strategy = StrategyExtractor.extract_strategy(raw_message, fallback=curr_strat)
            accumulated_entities.strategy = strategy

            # Decision Engine Multi-Objective Evaluation
            decision_res: DecisionSupportResult = await self.decision_support.evaluate_transport_options(
                origin=origin,
                destination=dest,
                commodity=commodity,
                weight_kg=weight_kg,
                available_vehicles=[],
                user_preference=strategy,
            )

            top_opt = decision_res.recommended_option
            if top_opt:
                # Calculate Operational Risk Estimates
                delay_pred = await self.active_delay_risk_model.predict(
                    DelayRiskFeatures(distance_km=210.0, vehicle_type=top_opt.vehicle_type)
                )
                cancel_pred = await self.active_cancel_risk_model.predict(
                    CancellationRiskFeatures(transporter_rating=4.8)
                )
                success_pred = await self.active_delivery_success_model.predict(
                    DeliverySuccessFeatures(
                        distance_km=210.0,
                        cargo_weight_kg=weight_kg,
                        vehicle_capacity_kg=top_opt.capacity_kg,
                        transporter_reliability_score=0.94,
                        delay_risk=delay_pred.prediction.delay_probability,
                        cancellation_risk=cancel_pred.prediction.cancellation_probability,
                    )
                )

                # Neural Reliability & Delay inference
                neural_tensor = NeuralFeatureTensor(np.array([[210.0, 8.0, 2.0, 30.0, 2.0, 0.35]], dtype=np.float32))
                neural_delay = self.neural_delay_learner.predict(neural_tensor)
                neural_reliability = self.neural_reliability_scorer.score_reliability(
                    completion_rate=0.98, punctuality_score=0.94, maintenance_score=0.92, rating=4.8
                )

                predictions = {
                    "estimated_freight": top_opt.estimated_cost,
                    "estimated_duration_minutes": top_opt.estimated_duration_minutes,
                    "formatted_duration": top_opt.formatted_duration,
                    "match_score": top_opt.match_score,
                    "cost_score": top_opt.cost_score,
                    "eta_score": top_opt.eta_score,
                    "utility_score": top_opt.utility_score,
                    "composite_score": top_opt.utility_score,
                    "delivery_success_probability": success_pred.prediction.success_probability,
                    "delay_risk": delay_pred.prediction.model_dump(),
                    "cancellation_risk": cancel_pred.prediction.model_dump(),
                    "delivery_success": success_pred.prediction.model_dump(),
                }

                neural_insights = {
                    "neural_expected_corridor_delay_mins": round(neural_delay, 1),
                    "neural_transporter_reliability_score": neural_reliability,
                    "semantic_embedding_dimension": 64,
                }

                options = [opt.model_dump() for opt in decision_res.all_ranked_options]

                recommended_action = {
                    "toolName": "create_logistics_request",
                    "actionType": "STAGED_MUTATION",
                    "params": {
                        "pickupLocation": origin,
                        "destination": dest,
                        "productName": commodity,
                        "quantity": weight_kg,
                        "vehicleType": top_opt.vehicle_type,
                        "estimatedFreight": top_opt.estimated_cost,
                        "estimatedDuration": top_opt.formatted_duration,
                    },
                }

                # Multilingual reasoning summary
                success_pct = success_pred.prediction.success_probability * 100
                if lang == 'hi':
                    if strategy == 'CHEAPEST':
                        reasoning_summary = f"लागत को आपकी प्राथमिकता माना गया है। उपलब्ध विकल्पों में {top_opt.vehicle_type} (किराया ₹{top_opt.estimated_cost:.0f}, समय {top_opt.formatted_duration}) सबसे किफायती है ({success_pct:.1f}% डिलीवरी सफलता निश्चितता)।"
                    elif strategy == 'FASTEST':
                        reasoning_summary = f"शीघ्रता को आपकी प्राथमिकता माना गया है। उपलब्ध विकल्पों में {top_opt.vehicle_type} (समय {top_opt.formatted_duration}, किराया ₹{top_opt.estimated_cost:.0f}) सबसे तेज है ({success_pct:.1f}% डिलीवरी सफलता निश्चितता)।"
                    elif strategy == 'HIGHEST_RELIABILITY':
                        reasoning_summary = f"सुरक्षा व विश्वसनीयता को प्राथमिकता मानते हुए {top_opt.vehicle_type} का चयन किया गया है ({success_pct:.1f}% डिलीवरी सफलता निश्चितता)।"
                    else:
                        reasoning_summary = f"संतुलित रणनीति के आधार पर {top_opt.vehicle_type} (₹{top_opt.estimated_cost:.0f}, {top_opt.formatted_duration}) की सिफारिश की गई है ({success_pct:.1f}% सफलता निश्चितता)।"
                elif lang == 'mr':
                    if strategy == 'CHEAPEST':
                        reasoning_summary = f"खर्चाला आपले प्राधान्य मानले आहे. उपलब्ध पर्यायांमध्ये {top_opt.vehicle_type} (भाडे ₹{top_opt.estimated_cost:.0f}, वेळ {top_opt.formatted_duration}) सर्वात किफायतशीर आहे ({success_pct:.1f}% यशस्वी डिलिव्हरी निश्चितता)."
                    elif strategy == 'FASTEST':
                        reasoning_summary = f"जलद वाहतुकीला प्राधान्य देत {top_opt.vehicle_type} (वेळ {top_opt.formatted_duration}) ची शिफारस केली आहे ({success_pct:.1f}% यशस्वी डिलिव्हरी निश्चितता)."
                    else:
                        reasoning_summary = f"संतुलित धोरणानुसार {top_opt.vehicle_type} (₹{top_opt.estimated_cost:.0f}, {top_opt.formatted_duration}) ची निवड केली आहे."
                else:
                    reasoning_summary = (
                        f"Recommended {top_opt.vehicle_type} (₹{top_opt.estimated_cost:.0f}, {top_opt.formatted_duration}) "
                        f"based on {strategy.lower()} strategy with {success_pct:.1f}% delivery success certainty."
                    )

        elif canonical.intent in ["GET_MARKET_DEMAND", "GET_PRICE_FORECAST"]:
            demand_res = await self.active_demand_model.predict(DemandFeatures(commodity=commodity))
            price_res = await self.active_price_model.predict(PriceFeatures(commodity=commodity))
            predictions = {
                "demand": demand_res.prediction.model_dump(),
                "price": price_res.prediction.model_dump(),
            }
            reasoning_summary = (
                f"APMC demand for {commodity} is {demand_res.prediction.demand_level} "
                f"({demand_res.prediction.predicted_demand_kg:.0f} kg) at spot price ₹{price_res.prediction.predicted_spot_price:.2f}/kg."
            )

        elif canonical.intent == "CREATE_PRODUCT_WORKFLOW":
            recommended_action = {
                "toolName": "create_product",
                "actionType": "STAGED_MUTATION",
                "params": {
                    "name": commodity,
                    "quantity": f"{weight_kg:.0f} kg",
                    "category": "Vegetables",
                    "grade": accumulated_entities.grade or "A",
                },
            }
            reasoning_summary = f"Prepared batch addition for {commodity} ({weight_kg:.0f} kg, Grade {accumulated_entities.grade or 'A'})."

        elif canonical.intent == "CREATE_PROCUREMENT_WORKFLOW":
            recommended_action = {
                "toolName": "create_procurement",
                "actionType": "STAGED_MUTATION",
                "params": {
                    "cropName": commodity,
                    "quantityRequired": f"{weight_kg:.0f} kg",
                    "targetPrice": f"₹{accumulated_entities.price_per_unit or 42}/kg",
                    "deliveryLocation": dest,
                },
            }
            reasoning_summary = f"Prepared procurement purchase demand for {commodity} ({weight_kg:.0f} kg) at {dest}."

        requires_confirmation = bool(recommended_action and recommended_action.get("actionType") == "STAGED_MUTATION")

        return StructuredIntelligenceDecision(
            intent=canonical.intent,
            role=effective_role,
            language=lang,
            entities=accumulated_entities.model_dump(exclude_none=True),
            goal=goal.model_dump() if goal else None,
            predictions=predictions,
            neural_insights=neural_insights,
            options=options,
            recommended_action=recommended_action,
            confidence=round(conf_eval.confidence.overall_confidence, 2),
            reasoning_summary=reasoning_summary,
            requires_confirmation=requires_confirmation,
            is_out_of_distribution=is_ood,
            calibrated_warning=calibrated_warning,
        )
