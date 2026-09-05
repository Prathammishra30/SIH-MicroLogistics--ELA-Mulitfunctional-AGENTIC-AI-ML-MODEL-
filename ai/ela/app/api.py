# FastAPI Route Definitions for ELA Service (Phase 7 Real-World Learning & Continuous Intelligence)
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from typing import Dict, Any, Optional, List
from pydantic import BaseModel, Field
from datetime import datetime
import base64

from ai.ela.agent.loop import AgentChatRequest, AgentChatResponse
from ai.ela.core.engine import ElaIntelligenceEngine
from ai.ela.core.intelligence_fusion import IntelligenceFusionEngine, StructuredIntelligenceDecision
from ai.ela.agent.state import UserRole, SupportedLanguage
from ai.ela.memory.session import ConversationMemory
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
from ai.ela.neural.provider import DistilledSemanticNeuralProvider, NeuralAnomalyResult
from ai.ela.neural.models import NeuralFeatureTensor, NeuralRouteDelayLearner, NeuralTransporterReliabilityScorer
from ai.ela.learning.error_analysis import ErrorAnalysisEngine, OperationalDiscrepancy, ErrorAnalysisDiagnosis
from ai.ela.learning.collector import FeedbackCollector
from ai.ela.learning.pattern_miner import PatternMiner, OperationalPattern
from ai.ela.learning.drift import DriftDetector, DriftAnalysisReport
from ai.ela.learning.retraining import RetrainingTriggerEngine, RetrainingProposal
from ai.ela.learning.evaluator import GovernedModelEvaluator, ModelEvaluationReport
from ai.ela.learning.registry import ModelRegistry, ModelMetadata
from ai.ela.learning.governance import ModelGovernanceGate, GovernanceAuditReport
from ai.ela.data.schemas import LearningEvent, ExplicitUserFeedback, ImplicitOperationalFeedback, BusinessOutcomeFeedback
from ai.ela.data.validation import DataQualityValidator
from ai.ela.ml.training.pipeline import MLTrainingPipeline, SyntheticDataGenerator
from ai.ela.providers.speech import NativeMockSTTProvider, NativeMockTTSProvider, TranscriptionResult, AudioSynthesisResult
from ai.ela.app.config import config
from ai.ela.agent.brain import ElaUniversalBrain

from ai.ela.neural.transformer.inference import TransformerNeuralCore
from ai.ela.neural.transformer.embeddings import ElaNeuralInput

from ai.ela.orchestration.service import MatchOrchestrationService, OrchestrationFailureException
from ai.ela.orchestration.matching import FarmerListing, BuyerProcurement, TransporterCapacity
from ai.ela.orchestration.governance import PartyDecision, MatchProposalStatus

router = APIRouter(prefix="/v1/ela", tags=["ELA Universal Intelligence"])
intelligence_engine = ElaIntelligenceEngine()
universal_brain = ElaUniversalBrain()
fusion_engine = IntelligenceFusionEngine()
stt_provider = NativeMockSTTProvider()
tts_provider = NativeMockTTSProvider()
transformer_core = TransformerNeuralCore.get_instance()
orchestration_service = MatchOrchestrationService()

# Active Models in Registry
demand_model = DemandPredictionModel()
price_model = PricePredictionModel()
eta_model = ETAPredictionModel()
cost_model = TransportCostModel()
match_model = VehicleMatchingModel()
delay_model = DelayProbabilityModel()
cancel_model = CancellationProbabilityModel()
success_model = DeliverySuccessProbabilityModel()

ModelRegistry.register_model(demand_model, "production")
ModelRegistry.register_model(price_model, "production")
ModelRegistry.register_model(eta_model, "production")
ModelRegistry.register_model(cost_model, "production")
ModelRegistry.register_model(match_model, "production")
ModelRegistry.register_model(delay_model, "production")
ModelRegistry.register_model(cancel_model, "production")
ModelRegistry.register_model(success_model, "production")
ModelRegistry.register_model(transformer_core, "production")


class NodeBridgeChatPayload(BaseModel):
    message: str
    context: Optional[Dict[str, Any]] = None
    user: Optional[Dict[str, Any]] = None
    session_id: Optional[str] = None


class VoiceTranscribePayload(BaseModel):
    audio_base64: str
    language: Optional[str] = "hi"


class SpeechSynthesizePayload(BaseModel):
    text: str
    language: Optional[str] = "en"
    voice: Optional[str] = None


class VoiceRespondPayload(BaseModel):
    audio_base64: str
    language: Optional[str] = "hi"
    context: Optional[Dict[str, Any]] = None
    user: Optional[Dict[str, Any]] = None
    session_id: Optional[str] = None


class RollbackRequest(BaseModel):
    target_version: str


@router.get("/health")
async def health_check():
    return {
        "service": config.service_name,
        "version": "7.0.0-continuous-intelligence",
        "status": "HEALTHY",
        "brain": "ELA Universal Brain (LLM + ML + Neural + Continuous Learning)",
        "models": {
            "demand": demand_model.current_version,
            "price": price_model.current_version,
            "eta": eta_model.current_version,
            "transport_cost": cost_model.current_version,
            "matching": match_model.current_version,
            "delay_probability": delay_model.current_version,
            "cancellation_probability": cancel_model.current_version,
            "delivery_success": success_model.current_version,
        },
        "neural": {
            "embedder": "DistilledSemanticNeuralProvider (dim=64)",
            "route_delay_learner": "NeuralRouteDelayLearner (MLP 6x16x8x1)",
            "reliability_scorer": "NeuralTransporterReliabilityScorer",
            "transformer_core": {
                "version": transformer_core.current_version,
                "parameter_count": transformer_core.parameter_count,
                "status": transformer_core.status,
                "backend": "PyTorch" if transformer_core.is_torch_active else "NumPy",
            },
        },
        "learning": {
            "events_recorded": len(FeedbackCollector.get_all_learning_events()),
            "governance_gate": "Active (Strict Holdout Verification)",
            "drift_detector": "Active",
            "pattern_miner": "Active",
        },
        "voice": {
            "stt_provider": stt_provider.provider_name,
            "tts_provider": tts_provider.provider_name,
            "supported_languages": ["en", "hi", "mr", "ta", "te", "bn", "kn"],
        },
        "timestamp": datetime.now().isoformat(),
    }


@router.post("/chat", response_model=AgentChatResponse)
async def process_chat(payload: NodeBridgeChatPayload):
    ctx = payload.context or {}
    user = payload.user or {}

    auth_role: UserRole = user.get("role", ctx.get("role", "GUEST"))
    lang: SupportedLanguage = ctx.get("language", "en")
    auth = bool(user.get("id"))

    is_voice = bool(ctx.get("isVoice") or ctx.get("is_voice", False))
    raw_conf = ctx.get("audioConfidence") if ctx.get("audioConfidence") is not None else ctx.get("audio_confidence")
    audio_confidence = float(raw_conf) if raw_conf is not None else 1.0

    req = AgentChatRequest(
        message=payload.message,
        session_id=payload.session_id or ctx.get("sessionId"),
        user_id=user.get("id"),
        authenticated=auth,
        authenticated_role=auth_role,
        language=lang,
        context=ctx,
        is_voice=is_voice,
        audio_confidence=audio_confidence,
    )
    return await universal_brain.process_chat(req)


@router.post("/decision/fuse", response_model=StructuredIntelligenceDecision)
async def fuse_intelligence_decision(payload: NodeBridgeChatPayload):
    ctx = payload.context or {}
    user = payload.user or {}

    auth_role: UserRole = user.get("role", ctx.get("role", "GUEST"))
    lang: SupportedLanguage = ctx.get("language", "en")
    auth = bool(user.get("id"))

    req = AgentChatRequest(
        message=payload.message,
        session_id=payload.session_id or ctx.get("sessionId"),
        user_id=user.get("id"),
        authenticated=auth,
        authenticated_role=auth_role,
        language=lang,
        context=ctx,
    )
    return await fusion_engine.fuse_and_decide(req)


# ----------------------------------------------------------------------------
# PHASE 7 LEARNING & GOVERNANCE APIS
# ----------------------------------------------------------------------------

@router.get("/learning/health")
async def learning_health():
    return {
        "learning_system": "Operational",
        "governed_gate_active": True,
        "zero_secret_shield": "Active",
        "total_learning_events": len(FeedbackCollector.get_all_learning_events()),
        "status": "HEALTHY",
        "timestamp": datetime.now().isoformat(),
    }


@router.get("/learning/status")
async def learning_status():
    events = FeedbackCollector.get_all_learning_events()
    real_count = sum(1 for e in events if e.dataset_type == "REAL_OPERATIONAL")
    synth_count = sum(1 for e in events if e.dataset_type == "SYNTHETIC")
    
    return {
        "total_learning_records": len(events),
        "real_operational_samples": real_count,
        "synthetic_samples": synth_count,
        "systematic_error_routes": ErrorAnalysisEngine.get_systematic_error_routes(),
        "is_sufficient_for_retraining": real_count >= 10,
        "timestamp": datetime.now().isoformat(),
    }


@router.post("/learning/event")
async def ingest_learning_event(event: LearningEvent):
    recorded = FeedbackCollector.record_learning_event(
        operation_type=event.operation_type,
        prediction_type=event.prediction_type,
        features=event.features,
        predicted_value=event.predicted_value,
        actual_value=event.actual_value,
        user_role=event.user_role,
        outcome=event.outcome,
        feedback_text=event.feedback_text,
        user_rating=event.user_rating,
        route_context=event.route_context,
        model_name=event.model_name,
        model_version=event.model_version,
        confidence=event.confidence,
        dataset_type=event.dataset_type,
        dataset_partition=event.dataset_partition,
    )
    return {"status": "INGESTED", "event": recorded.model_dump()}


@router.post("/learning/feedback")
async def record_feedback(payload: Dict[str, Any]):
    rec = FeedbackCollector.record_feedback(
        session_id=payload.get("sessionId", "session-default"),
        action_type=payload.get("actionType", "PREDICTION"),
        user_id=payload.get("userId"),
        prediction_made=payload.get("predictionMade"),
        actual_outcome=payload.get("actualOutcome"),
        user_rating=payload.get("userRating"),
        feedback_text=payload.get("feedbackText"),
    )
    return {"status": "RECORDED", "record": rec.model_dump()}


@router.get("/learning/patterns")
async def get_learned_patterns():
    records = FeedbackCollector.get_candidate_training_dataset()
    patterns = PatternMiner.mine_patterns(records)
    return {
        "patterns_count": len(patterns),
        "patterns": [p.model_dump() for p in patterns],
        "timestamp": datetime.now().isoformat(),
    }


@router.get("/learning/drift")
async def get_drift_analysis(model_name: str = "ETAPredictionModel"):
    records = FeedbackCollector.get_candidate_training_dataset(model_name=model_name)
    n = len(records)
    if n >= 10:
        base_split = records[:n//2]
        recent_split = records[n//2:]
    else:
        base_split = records
        recent_split = records

    report = DriftDetector.detect_drift(
        model_name=model_name,
        baseline_records=base_split,
        recent_records=recent_split,
    )
    return report.model_dump()


@router.post("/learning/train")
async def train_candidate_model(model_name: str = "DemandPredictionModel"):
    proposal = RetrainingTriggerEngine.evaluate_retraining_trigger(
        model_name=model_name,
        current_version="v1.2",
    )
    if not proposal.is_governed_retrain_ready:
        # Fallback to reproducible development cycle
        dataset = SyntheticDataGenerator.generate_demand_dataset(count=150)
        candidate = DemandPredictionModel(version="v1.3-candidate", status="candidate")
        cycle_res = await MLTrainingPipeline.run_training_cycle(candidate, dataset)
        return {
            "status": "TRAINED_DEVELOPMENT_CANDIDATE",
            "proposal": proposal.model_dump(),
            "training_cycle": cycle_res,
        }

    return {"status": "PROPOSAL_ACCEPTED", "proposal": proposal.model_dump()}


@router.get("/learning/evaluation")
@router.get("/evaluation")
async def get_evaluation_overview():
    return {
        "benchmark_scenarios_count": 55,
        "categories": [
            "INTENT_ACCURACY",
            "MULTILINGUAL_HINGLISH",
            "ENTITY_EXTRACTION",
            "CLARIFICATION_LOOP",
            "ROLE_SWITCHING",
            "LOGIN_ROUTING",
            "SECURITY_CREDENTIAL_SHIELD",
            "RBAC_SECURITY",
            "CONFIRMATION_STAGING",
            "ML_PREDICTIONS",
            "SELF_LEARNING_GOVERNANCE",
            "MEMORY_PRIVACY",
            "NEURAL_EMBEDDINGS",
            "ERROR_ANALYSIS",
            "DRIFT_DETECTION",
            "MODEL_PROMOTION_ROLLBACK",
        ],
        "target_pass_rate": 1.0,
        "timestamp": datetime.now().isoformat(),
    }


# ----------------------------------------------------------------------------
# MODEL REGISTRY & ROLLBACK APIS
# ----------------------------------------------------------------------------

@router.get("/models")
async def list_models():
    return {
        "models": ModelRegistry.get_all_models_summary(),
        "total_count": len(ModelRegistry.get_all_active_models()),
        "timestamp": datetime.now().isoformat(),
    }


@router.get("/models/{model_name}")
async def get_model_details(model_name: str):
    model = ModelRegistry.get_active_model(model_name)
    if not model:
        raise HTTPException(status_code=404, detail=f"Model '{model_name}' not found in registry.")
    versions = ModelRegistry.get_model_versions(model_name)
    return {
        "model_name": model_name,
        "current_version": model.current_version,
        "status": getattr(model, "status", "production"),
        "metrics": model.metrics.model_dump() if hasattr(model, "metrics") and model.metrics else None,
        "versions": [v.model_dump() for v in versions],
    }


@router.get("/models/{model_name}/versions")
async def get_model_versions_list(model_name: str):
    versions = ModelRegistry.get_model_versions(model_name)
    if not versions:
        raise HTTPException(status_code=404, detail=f"No versions found for model '{model_name}'.")
    return {"model_name": model_name, "versions": [v.model_dump() for v in versions]}


@router.post("/models/{model_name}/evaluate")
async def evaluate_candidate(model_name: str):
    active = ModelRegistry.get_active_model(model_name)
    if not active:
        raise HTTPException(status_code=404, detail=f"Active model '{model_name}' not found.")

    holdout = SyntheticDataGenerator.generate_demand_dataset(count=40)[25:]
    candidate = DemandPredictionModel(version=f"{active.current_version}-cand", status="candidate")
    report = await GovernedModelEvaluator.compare_models(active, candidate, holdout)
    return report.model_dump()


@router.post("/models/{model_name}/promote")
async def promote_model_candidate(model_name: str):
    active = ModelRegistry.get_active_model(model_name)
    if not active:
        raise HTTPException(status_code=404, detail=f"Model '{model_name}' not found.")

    holdout = SyntheticDataGenerator.generate_demand_dataset(count=40)[25:]
    candidate = DemandPredictionModel(version="v1.3-promoted", status="candidate")
    report = await GovernedModelEvaluator.compare_models(active, candidate, holdout)
    gov_audit = ModelGovernanceGate.evaluate_promotion(candidate, report)

    promoted = False
    if gov_audit.decision == "APPROVE":
        promoted = ModelRegistry.promote_candidate(candidate, report)

    return {
        "model_name": model_name,
        "promoted": promoted,
        "governance_audit": gov_audit.model_dump(),
        "evaluation_report": report.model_dump(),
    }


@router.post("/models/{model_name}/rollback")
async def rollback_model_version(model_name: str, payload: RollbackRequest):
    success = ModelRegistry.rollback(model_name, payload.target_version)
    if not success:
        raise HTTPException(status_code=400, detail=f"Rollback failed. Target version '{payload.target_version}' not found.")
    return {
        "model_name": model_name,
        "rolled_back_to": payload.target_version,
        "status": "SUCCESS",
        "timestamp": datetime.now().isoformat(),
    }


# ----------------------------------------------------------------------------
# PREDICTIVE & VOICE APIS
# ----------------------------------------------------------------------------

@router.post("/voice/transcribe", response_model=TranscriptionResult)
async def transcribe_voice(payload: VoiceTranscribePayload):
    try:
        audio_bytes = base64.b64decode(payload.audio_base64)
    except Exception:
        audio_bytes = b""
    return await stt_provider.transcribe(audio_bytes, target_language=payload.language)


@router.post("/speech/synthesize", response_model=AudioSynthesisResult)
async def synthesize_speech(payload: SpeechSynthesizePayload):
    return await tts_provider.synthesize(payload.text, language=payload.language or "en", voice=payload.voice)


@router.post("/predict/demand")
async def predict_demand(features: DemandFeatures):
    res = await demand_model.predict(features)
    return res.model_dump()


@router.post("/predict/price")
async def predict_price(features: PriceFeatures):
    res = await price_model.predict(features)
    return res.model_dump()


@router.post("/predict/eta")
async def predict_eta(features: EtaFeatures):
    res = await eta_model.predict(features)
    return res.model_dump()


@router.post("/predict/transport-cost")
async def predict_transport_cost(features: TransportCostFeatures):
    res = await cost_model.predict(features)
    return res.model_dump()


@router.post("/predict/cost")
async def predict_cost_alias(features: TransportCostFeatures):
    res = await cost_model.predict(features)
    return res.model_dump()


@router.post("/predict/matching")
async def predict_matching(features: VehicleMatchingFeatures):
    res = await match_model.predict(features)
    return res.model_dump()


@router.post("/predict/delay-risk")
async def predict_delay_risk(features: DelayRiskFeatures):
    res = await delay_model.predict(features)
    return res.model_dump()


@router.post("/predict/cancellation-risk")
async def predict_cancellation_risk(features: CancellationRiskFeatures):
    res = await cancel_model.predict(features)
    return res.model_dump()


@router.post("/predict/delivery-success")
async def predict_delivery_success(features: DeliverySuccessFeatures):
    res = await success_model.predict(features)
    return res.model_dump()


@router.post("/learning/error-analysis")
async def diagnose_error(discrepancy: OperationalDiscrepancy):
    diag = ErrorAnalysisEngine.diagnose_error(discrepancy)
    return diag.model_dump()


# ----------------------------------------------------------------------------
# PHASE 12.1 TRANSFORMER NEURAL CORE INTERNAL ENDPOINTS
# ----------------------------------------------------------------------------

@router.post("/internal/neural/transformer/infer")
async def transformer_infer(payload: ElaNeuralInput):
    """
    Executes real tensor inference through the ELA Transformer Neural Core.
    Returns contextual representation summary, intent predictions, and decision readiness score.
    """
    state = transformer_core.encode(payload)
    return state.model_dump()


@router.get("/internal/neural/transformer/info")
async def transformer_info():
    """
    Returns model metadata, configuration, parameter count, and cryptographic checksum.
    """
    return transformer_core.model_info()


@router.get("/internal/neural/transformer/health")
async def transformer_health():
    """
    Returns active runtime health, backend status (PyTorch vs NumPy), and parameter accounting.
    """
    return transformer_core.health()


# ----------------------------------------------------------------------------
# CROSS-ROLE MATCH ORCHESTRATION ENDPOINTS
# ----------------------------------------------------------------------------

class MatchSearchPayload(BaseModel):
    farmer: Optional[FarmerListing] = None
    buyers: Optional[List[BuyerProcurement]] = None
    transporters: Optional[List[TransporterCapacity]] = None
    top_n: int = 3


class DecisionPayload(BaseModel):
    role: str
    decision: str
    reason: Optional[str] = None


@router.post("/orchestration/matches")
async def find_matches(payload: MatchSearchPayload):
    if not payload.farmer:
        raise HTTPException(status_code=400, detail="FarmerListing required to evaluate cross-role matches")
    try:
        proposals = orchestration_service.match_farmer_produce(
            farmer=payload.farmer,
            buyers=payload.buyers or [],
            transporters=payload.transporters or [],
            top_n=payload.top_n,
        )
        return [p.model_dump() for p in proposals]
    except OrchestrationFailureException as ofe:
        raise HTTPException(
            status_code=422,
            detail={
                "code": ofe.code,
                "message": ofe.message,
                "localized_messages": ofe.localized_messages,
            }
        )


@router.get("/orchestration/proposals")
async def list_proposals(role: Optional[str] = None, participant_id: Optional[str] = None):
    if role:
        proposals = orchestration_service.get_proposals_for_role(role, participant_id)
    else:
        proposals = list(orchestration_service._proposals.values())
    return [p.model_dump() for p in proposals]


@router.get("/orchestration/proposals/{proposal_id}")
async def get_proposal(proposal_id: str):
    p = orchestration_service.get_proposal_by_id(proposal_id)
    if not p:
        raise HTTPException(status_code=404, detail=f"Proposal {proposal_id} not found")
    return p.model_dump()


@router.post("/orchestration/proposals/{proposal_id}/decision")
async def submit_proposal_decision(proposal_id: str, payload: DecisionPayload):
    try:
        decision_enum = PartyDecision(payload.decision.upper().strip())
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid decision: {payload.decision}. Must be APPROVED or DECLINED.")
    
    ok, msg, prop = orchestration_service.submit_decision(
        proposal_id=proposal_id,
        role=payload.role,
        decision=decision_enum,
        reason=payload.reason,
    )
    if not ok and not prop:
        raise HTTPException(status_code=404, detail=msg)
    return {
        "success": ok,
        "message": msg,
        "proposal": prop.model_dump() if prop else None,
    }
