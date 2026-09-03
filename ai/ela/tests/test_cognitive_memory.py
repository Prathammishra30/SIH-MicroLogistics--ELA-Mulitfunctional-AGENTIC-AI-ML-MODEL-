# ELA Phase 12.2 Cognitive Memory & Context Fusion Test Suite
import pytest
import datetime
from datetime import timezone

from ai.ela.memory.records import ElaMemoryRecord, EVIDENCE_WEIGHTS
from ai.ela.memory.goal import ElaGoal
from ai.ela.memory.contradiction import ContradictionDetector, ContradictionRecord
from ai.ela.memory.store import CognitiveMemoryStore
from ai.ela.memory.retrieval import CognitiveMemoryRetriever
from ai.ela.memory.writer import GovernedMemoryWriter
from ai.ela.memory.context import ElaCognitiveContext
from ai.ela.agent.state import CanonicalEntities
from ai.ela.neural.transformer.embeddings import ElaNeuralInput, ElaInputVectorizer
from ai.ela.neural.transformer.inference import TransformerNeuralCore
from ai.ela.agent.brain import ElaUniversalBrain
from ai.ela.agent.loop import AgentChatRequest


@pytest.fixture(autouse=True)
def clean_memory():
    CognitiveMemoryStore.reset_for_testing()
    yield
    CognitiveMemoryStore.reset_for_testing()


def test_memory_record_creation_and_evidence_weights():
    rec = ElaMemoryRecord(
        session_id="sess-1",
        memory_type="DECISION",
        content="Recommended Mini Truck for 500kg tomatoes",
        structured_data={"vehicle": "Mini Truck", "cost": 2800},
        provenance="SYSTEM_OBSERVED",
        evidence_class="VERIFIED",
    )
    assert rec.memory_id.startswith("mem-")
    assert rec.evidence_weight == 1.0
    assert rec.status == "ACTIVE"
    assert not rec.is_stale()


def test_memory_lifecycle_update_invalidate_and_archive():
    rec = ElaMemoryRecord(
        session_id="sess-1",
        memory_type="SEMANTIC",
        content="Farmer prefers Hindi language",
        structured_data={"lang": "hi"},
        provenance="USER_STATED",
    )
    CognitiveMemoryStore.create(rec)
    
    # Read
    loaded = CognitiveMemoryStore.read(rec.memory_id)
    assert loaded is not None
    assert loaded.content == "Farmer prefers Hindi language"

    # Update
    updated = CognitiveMemoryStore.update(rec.memory_id, {"content": "Farmer prefers Marathi language"})
    assert updated.content == "Farmer prefers Marathi language"

    # Invalidate
    invalidated = CognitiveMemoryStore.invalidate(rec.memory_id, "User requested preference reset")
    assert invalidated is True
    assert rec.status == "INVALIDATED"
    assert rec.is_stale()

    # Archive
    archived = CognitiveMemoryStore.archive(rec.memory_id)
    assert archived is True
    assert rec.status == "ARCHIVED"


def test_memory_expiration_and_ttl():
    # Record expiring in the past
    past_time = (datetime.datetime.now(timezone.utc) - datetime.timedelta(minutes=10)).isoformat()
    stale_rec = ElaMemoryRecord(
        session_id="sess-ttl",
        memory_type="OPERATIONAL",
        content="Traffic jam on Nashik-Pune expressway",
        structured_data={"delay_mins": 60},
        provenance="SYSTEM_OBSERVED",
        expires_at=past_time,
    )
    CognitiveMemoryStore.create(stale_rec)
    assert stale_rec.is_stale() is True

    # Check expiration engine
    expired_count = CognitiveMemoryStore.expire_stale_records()
    assert expired_count == 1
    assert stale_rec.status == "EXPIRED"

    # Ensure stale record is filtered from active records
    active = CognitiveMemoryStore.get_active_records("sess-ttl")
    assert len(active) == 0


def test_relevance_ranking_prioritizes_active_goal_and_entities():
    active_goal = ElaGoal(
        goal_id="goal-tomatoes-1",
        session_id="sess-rel",
        objective="Transport 500kg tomatoes from Nashik to Pune",
        strategy="CHEAPEST",
    )
    CognitiveMemoryStore.set_active_goal("sess-rel", active_goal)

    # Record 1: Matched goal and commodity
    rec1 = ElaMemoryRecord(
        session_id="sess-rel",
        goal_id="goal-tomatoes-1",
        memory_type="DECISION",
        content="Recommended Mini Truck for 500kg tomatoes",
        structured_data={"commodity": "tomatoes", "pickup_location": "Nashik", "destination": "Pune"},
        provenance="AGENT_OUTPUT",
        evidence_class="OBSERVED",
        importance=0.9,
    )
    CognitiveMemoryStore.create(rec1)

    # Record 2: Unrelated goal and different commodity
    rec2 = ElaMemoryRecord(
        session_id="sess-rel",
        goal_id="goal-onions-99",
        memory_type="EPISODIC",
        content="User checked onion market demand last week",
        structured_data={"commodity": "onions", "pickup_location": "Solapur", "destination": "Mumbai"},
        provenance="USER_STATED",
        importance=0.4,
    )
    CognitiveMemoryStore.create(rec2)

    entities = CanonicalEntities(commodity="tomatoes", pickup_location="Nashik", destination="Pune")
    scored = CognitiveMemoryRetriever.retrieve(
        session_id="sess-rel",
        active_goal=active_goal,
        intent="CREATE_LOGISTICS_WORKFLOW",
        entities=entities,
        top_k=5,
    )

    assert len(scored) == 2
    # rec1 should rank strictly higher than rec2
    top_record, top_score = scored[0]
    second_record, second_score = scored[1]
    assert top_record.memory_id == rec1.memory_id
    assert top_score > second_score


def test_contradiction_detection_and_recency_superseding():
    old_rec = ElaMemoryRecord(
        session_id="sess-conflict",
        memory_type="CONSTRAINT",
        content="User prefers cheapest transport",
        structured_data={"strategy": "CHEAPEST"},
        provenance="USER_STATED",
        evidence_class="USER_STATED",
        importance=0.8,
    )
    CognitiveMemoryStore.create(old_rec)

    # New contradictory instruction: user prioritizes reliability
    new_rec = ElaMemoryRecord(
        session_id="sess-conflict",
        memory_type="CONSTRAINT",
        content="User prioritizes reliability over cost",
        structured_data={"strategy": "MOST_RELIABLE"},
        provenance="USER_STATED",
        evidence_class="USER_STATED",
        importance=0.9,
    )

    contra = CognitiveMemoryStore.supersede(old_rec.memory_id, new_rec, conflict_type="STRATEGY_SHIFT")
    assert contra.conflict_type == "STRATEGY_SHIFT"
    assert contra.resolution_rule == "PREFER_NEWER_USER_STATED"
    assert contra.superseded_memory_id == old_rec.memory_id
    assert contra.winning_memory_id == new_rec.memory_id
    assert old_rec.status == "SUPERSEDED"
    assert new_rec.status == "ACTIVE"

    # Only new_rec should appear in active records
    active = CognitiveMemoryStore.get_active_records("sess-conflict")
    assert len(active) == 1
    assert active[0].structured_data["strategy"] == "MOST_RELIABLE"


def test_contradiction_java_verified_overrides_prediction():
    pred_rec = ElaMemoryRecord(
        session_id="sess-verif",
        memory_type="OPERATIONAL",
        content="Model predicts vehicle MH-15-AB-1234 will arrive on time",
        structured_data={"status": "ON_TIME"},
        provenance="MODEL_INFERENCE",
        evidence_class="PREDICTED",
    )
    CognitiveMemoryStore.create(pred_rec)

    verified_rec = ElaMemoryRecord(
        session_id="sess-verif",
        memory_type="OUTCOME",
        content="Java backend verified breakdown for MH-15-AB-1234 at toll gate",
        structured_data={"status": "BREAKDOWN"},
        provenance="JAVA_VERIFIED",
        evidence_class="VERIFIED",
    )

    contra = ContradictionDetector.resolve_contradiction(pred_rec, verified_rec, conflict_type="OPERATIONAL_DISCREPANCY")
    assert contra.resolution_rule == "PREFER_JAVA_VERIFIED"
    assert pred_rec.status == "SUPERSEDED"


def test_memory_security_and_credential_shield_redaction():
    # Passwords / OTPs must be rejected by GovernedMemoryWriter
    secret_content = "User said my secret password is Password123! and otp is 998811"
    rec, accepted, reason = GovernedMemoryWriter.create_memory(
        session_id="sess-sec",
        user_id="user-1",
        goal_id=None,
        memory_type="SEMANTIC",
        content=secret_content,
        structured_data={"password": "Password123!"},
        provenance="USER_STATED",
        evidence_class="USER_STATED",
    )
    assert accepted is False
    assert "CREDENTIAL_SHIELD" in reason
    assert rec is None

    # Hallucinations / speculative statements rejected
    speculative = "As an AI language model, I think you might like tomatoes"
    rec_spec, accepted_spec, reason_spec = GovernedMemoryWriter.create_memory(
        session_id="sess-spec",
        user_id="user-1",
        goal_id=None,
        memory_type="SEMANTIC",
        content=speculative,
        structured_data={},
        provenance="MODEL_INFERENCE",
        evidence_class="INFERRED",
    )
    assert accepted_spec is False
    assert "SPECULATIVE" in reason_spec


def test_cross_user_memory_authorization_boundary():
    rec_alice = ElaMemoryRecord(
        session_id="sess-alice",
        user_id="user-alice",
        memory_type="SEMANTIC",
        content="Alice's private farm address",
        structured_data={"address": "Plot 42, Dindori, Nashik"},
        provenance="USER_STATED",
    )
    CognitiveMemoryStore.create(rec_alice)

    # Bob attempts to read Alice's memory
    bob_read = CognitiveMemoryStore.read(rec_alice.memory_id, requesting_user_id="user-bob")
    assert bob_read is None, "Cross-user private memory access must be blocked"

    # Alice reads her own memory
    alice_read = CognitiveMemoryStore.read(rec_alice.memory_id, requesting_user_id="user-alice")
    assert alice_read is not None
    assert alice_read.content == "Alice's private farm address"


def test_cognitive_context_snapshot_and_transformer_memory_features():
    goal = ElaGoal(
        goal_id="goal-ctx",
        session_id="sess-ctx",
        objective="Send tomatoes",
        strategy="CHEAPEST",
    )
    dec_rec = ElaMemoryRecord(
        session_id="sess-ctx",
        goal_id="goal-ctx",
        memory_type="DECISION",
        content="Recommended Mini Truck",
        structured_data={"vehicle_type": "Mini Truck (750 kg)", "strategy": "CHEAPEST"},
        provenance="SYSTEM_OBSERVED",
    )
    const_rec = ElaMemoryRecord(
        session_id="sess-ctx",
        goal_id="goal-ctx",
        memory_type="CONSTRAINT",
        content="Max budget 3000",
        structured_data={"max_budget": 3000},
        provenance="USER_STATED",
    )

    ctx = ElaCognitiveContext(
        session_id="sess-ctx",
        current_request_message="Find best vehicle",
        active_goal=goal,
        relevant_memories=[dec_rec, const_rec],
        operational_state={"corridor": "Nashik-Pune", "corridor_delay_mins": 30.0},
        strategy="CHEAPEST",
    )

    mem_feats = ctx.to_transformer_memory_features()
    assert mem_feats["memory_count"] == 2
    assert mem_feats["has_active_constraint"] is True
    assert mem_feats["has_decision"] is True
    assert mem_feats["previous_recommended_vehicle"] == "Mini Truck (750 kg)"
    assert "DECISION" in mem_feats["memory_categories"]
    assert "CONSTRAINT" in mem_feats["memory_categories"]


def test_transformer_input_vectorizer_embeds_memory_tokens():
    neural_input = ElaNeuralInput(
        session_id="sess-vec",
        role="FARMER",
        intent="CREATE_LOGISTICS_WORKFLOW",
        entities={"commodity": "tomatoes", "quantity": 500.0, "pickup_location": "Nashik", "destination": "Pune"},
        context={"strategy": "CHEAPEST"},
        memory_features={
            "memory_count": 2,
            "memory_categories": ["DECISION", "CONSTRAINT"],
            "previous_recommended_vehicle": "mini truck",
            "has_active_constraint": True,
            "has_verified_outcome": True,
        },
        operational_features={"weight_kg": 500.0, "distance_km": 200.0},
        raw_text="Show me available vehicles",
    )

    token_ids, mask, num_feats = ElaInputVectorizer.vectorize(neural_input, max_seq_len=32)

    # Check memory category tokens present
    # MEM_DECISION = 74, MEM_CONSTRAINT = 77, VEH_MINI_TRUCK = 80, OUTCOME_SUCCESS = 85
    token_list = token_ids.tolist()
    assert 74 in token_list, "DECISION memory token (74) must be in token IDs"
    assert 77 in token_list, "CONSTRAINT memory token (77) must be in token IDs"
    assert 80 in token_list, "Mini truck token (80) must be in token IDs"
    assert 85 in token_list, "Outcome success token (85) must be in token IDs"

    # Numerical features
    assert num_feats["norm_memory_count"] == 0.2
    assert num_feats["has_active_constraint"] == 1.0
    assert num_feats["has_decision"] == 1.0
    assert num_feats["has_verified_outcome"] == 1.0


@pytest.mark.asyncio
async def test_brain_multiturn_goal_continuity_and_decision_retrieval():
    brain = ElaUniversalBrain()
    session_id = "multiturn-verify-sess"

    # Turn 1: Establish Goal
    req1 = AgentChatRequest(
        message="I have 500 kg tomatoes in Nashik and need to send them to Pune.",
        authenticated=True,
        authenticated_role="FARMER",
        language="en",
        session_id=session_id,
    )
    resp1 = await brain.process_chat(req1)
    assert resp1.status == "CONFIRMATION_REQUIRED"
    assert resp1.trace.memory is not None
    assert resp1.trace.memory["retrieval_attempted"] is True

    # Check that decision memory was written
    active_mems = CognitiveMemoryStore.get_active_records(session_id)
    assert any(m.memory_type == "DECISION" for m in active_mems)

    # Turn 2: Strategy refinement (CHEAPEST)
    req2 = AgentChatRequest(
        message="Find the cheapest option.",
        authenticated=True,
        authenticated_role="FARMER",
        language="en",
        session_id=session_id,
    )
    resp2 = await brain.process_chat(req2)
    assert resp2.trace.strategy == "CHEAPEST"

    # Turn 3: Contradiction / Strategy shift (RELIABILITY)
    req3 = AgentChatRequest(
        message="Actually choose the most reliable one.",
        authenticated=True,
        authenticated_role="FARMER",
        language="en",
        session_id=session_id,
    )
    resp3 = await brain.process_chat(req3)
    assert resp3.trace.strategy in ["MOST_RELIABLE", "HIGHEST_RELIABILITY"]
    assert resp3.trace.memory["contradictions_detected"] >= 1

    # Turn 4: Decision Recall Question
    req4 = AgentChatRequest(
        message="What did you recommend earlier?",
        authenticated=True,
        authenticated_role="FARMER",
        language="en",
        session_id=session_id,
    )
    resp4 = await brain.process_chat(req4)
    # Check that response references previous recommendation
    assert "recommended" in resp4.message.lower() or "mini truck" in resp4.message.lower() or "tomatoes" in resp4.message.lower()
    assert resp4.trace.memory["retrieved_count"] > 0
    assert resp4.trace.transformer["enabled"] is True
