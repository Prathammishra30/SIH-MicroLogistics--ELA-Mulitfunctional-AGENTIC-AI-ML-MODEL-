# FastAPI Route Definitions for ELA Service (Phase 5 Core Intelligence Fusion)
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from typing import Dict, Any, Optional, List
from pydantic import BaseModel, Field
from datetime import datetime
import base64

from ai.ela.agent.loop import AgentChatRequest, AgentChatResponse
from ai.ela.core.engine import ElaIntelligenceEngine
from ai.ela.agent.state import UserRole, SupportedLanguage
from ai.ela.memory.session import ConversationMemory
from ai.ela.ml.models.demand import DemandPredictionModel, DemandFeatures
from ai.ela.ml.models.price import PricePredictionModel, PriceFeatures
from ai.ela.ml.models.eta import ETAPredictionModel, EtaFeatures
from ai.ela.ml.models.transport import TransportCostModel, TransportCostFeatures
from ai.ela.ml.models.matching import VehicleMatchingModel, VehicleMatchingFeatures
from ai.ela.ml.training.pipeline import MLTrainingPipeline, SyntheticDataGenerator
from ai.ela.learning.collector import FeedbackCollector
from ai.ela.learning.evaluator import GovernedModelEvaluator, ModelRegistry
from ai.ela.providers.speech import NativeMockSTTProvider, NativeMockTTSProvider, TranscriptionResult, AudioSynthesisResult
from ai.ela.app.config import config

router = APIRouter(prefix="/v1/ela", tags=["ELA Intelligence"])
intelligence_engine = ElaIntelligenceEngine()
stt_provider = NativeMockSTTProvider()
tts_provider = NativeMockTTSProvider()

# Active Models in Registry
demand_model = DemandPredictionModel()
price_model = PricePredictionModel()
eta_model = ETAPredictionModel()
cost_model = TransportCostModel()
match_model = VehicleMatchingModel()

ModelRegistry.register_model(demand_model, "production")
ModelRegistry.register_model(price_model, "production")
ModelRegistry.register_model(eta_model, "production")
ModelRegistry.register_model(cost_model, "production")
ModelRegistry.register_model(match_model, "production")


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


@router.get("/health")
async def health_check():
    return {
        "service": config.service_name,
        "version": config.version,
        "status": "HEALTHY",
        "models": {
            "demand": demand_model.current_version,
            "price": price_model.current_version,
            "eta": eta_model.current_version,
            "transport_cost": cost_model.current_version,
            "matching": match_model.current_version,
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

    req = AgentChatRequest(
        message=payload.message,
        session_id=payload.session_id or ctx.get("sessionId"),
        user_id=user.get("id"),
        authenticated=auth,
        authenticated_role=auth_role,
        language=lang,
        context=ctx,
    )
    return await intelligence_engine.process_chat(req)


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


@router.post("/voice/respond")
async def voice_respond(payload: VoiceRespondPayload):
    try:
        audio_bytes = base64.b64decode(payload.audio_base64)
    except Exception:
        audio_bytes = b""

    transcription = await stt_provider.transcribe(audio_bytes, target_language=payload.language)

    ctx = payload.context or {}
    user = payload.user or {}
    auth_role: UserRole = user.get("role", ctx.get("role", "GUEST"))
    auth = bool(user.get("id"))

    req = AgentChatRequest(
        message=transcription.text,
        session_id=payload.session_id or ctx.get("sessionId"),
        user_id=user.get("id"),
        authenticated=auth,
        authenticated_role=auth_role,
        language=transcription.detected_language,  # type: ignore
        context=ctx,
    )
    chat_response = await intelligence_engine.process_chat(req)

    synthesis = await tts_provider.synthesize(
        chat_response.message, language=chat_response.language
    )

    return {
        "transcription": transcription.model_dump(),
        "chat_response": chat_response.model_dump(),
        "audio_synthesis": synthesis.model_dump(),
        "timestamp": datetime.now().isoformat(),
    }


@router.get("/session/{session_id}")
async def get_session_state(session_id: str):
    sess = ConversationMemory.get_session(session_id)
    return {
        "session_id": sess.session_id,
        "turns": sess.turns,
        "accumulated_entities": sess.accumulated_entities.model_dump(),
        "last_intent": sess.last_intent,
        "active_goal": sess.active_goal.model_dump() if sess.active_goal else None,
    }


@router.get("/tasks/{session_id}")
async def get_tasks(session_id: str):
    sess = ConversationMemory.get_session(session_id)
    return {
        "active_goal": sess.active_goal.model_dump() if sess.active_goal else None,
        "subtasks": [s.model_dump() for s in sess.active_goal.subtasks] if sess.active_goal else [],
    }


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


@router.post("/train")
@router.post("/train/demand")
async def train_demand_model():
    dataset = SyntheticDataGenerator.generate_demand_dataset(count=150)
    candidate_model = DemandPredictionModel(version="v1.3-candidate", status="candidate")
    cycle_res = await MLTrainingPipeline.run_training_cycle(candidate_model, dataset)
    return cycle_res


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
        ],
        "target_pass_rate": 1.0,
        "timestamp": datetime.now().isoformat(),
    }


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
