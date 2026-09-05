# Unit & Integration Test Suite for Cross-Role Match Orchestration Subsystem
# Tests hard gates, scoring, explanations, localization, multi-party consent, failure paths, and Java Authority dispatch.

import pytest
from datetime import date, datetime, timezone, timedelta
from typing import List, Dict, Any

from ai.ela.orchestration.matching import (
    FarmerListing,
    BuyerProcurement,
    TransporterCapacity,
    CrossRoleMatchEngine,
    passes_gates,
    match_score,
    explain,
    explain_localized,
    haversine_km,
)
from ai.ela.orchestration.governance import (
    MatchProposal,
    MatchProposalStatus,
    PartyDecision,
    MultiPartyGovernanceEngine,
)
from ai.ela.orchestration.service import (
    MatchOrchestrationService,
    OrchestrationFailureException,
)


@pytest.fixture(autouse=True)
def reset_service_state():
    MatchOrchestrationService.reset_state_for_testing()
    yield
    MatchOrchestrationService.reset_state_for_testing()


# ===========================================================================
# 1. 5 HARD GATES TESTS
# ===========================================================================

def test_gate_1_crop_mismatch():
    farmer = FarmerListing(
        id="f1", crop="Tomatoes", quantity_kg=500, quality_grade=1,
        asking_price_per_kg=30.0, lat=18.5204, lng=73.8567, harvest_date=date(2026, 8, 20)
    )
    buyer = BuyerProcurement(
        id="b1", crop_needed="Onions", min_quality_grade=2, budget_per_kg=40.0,
        lat=18.9894, lng=73.1175, max_radius_km=150.0, needed_by=date(2026, 8, 25)
    )
    transporter = TransporterCapacity(
        id="t1", capacity_kg=1000, current_lat=18.6, current_lng=73.9,
        max_radius_km=150.0, available_from=date(2026, 8, 19), available_to=date(2026, 8, 25)
    )

    passed, reason = passes_gates(farmer, buyer, transporter)
    assert not passed
    assert "crop mismatch" in reason.lower()


def test_gate_2_quality_mismatch():
    # Farmer has Grade 3 (lower quality), buyer requires at least Grade 2
    farmer = FarmerListing(
        id="f1", crop="Tomatoes", quantity_kg=500, quality_grade=3,
        asking_price_per_kg=25.0, lat=18.5204, lng=73.8567, harvest_date=date(2026, 8, 20)
    )
    buyer = BuyerProcurement(
        id="b1", crop_needed="Tomatoes", min_quality_grade=2, budget_per_kg=40.0,
        lat=18.9894, lng=73.1175, max_radius_km=150.0, needed_by=date(2026, 8, 25)
    )
    transporter = TransporterCapacity(
        id="t1", capacity_kg=1000, current_lat=18.6, current_lng=73.9,
        max_radius_km=150.0, available_from=date(2026, 8, 19), available_to=date(2026, 8, 25)
    )

    passed, reason = passes_gates(farmer, buyer, transporter)
    assert not passed
    assert "quality" in reason.lower()


def test_gate_3_capacity_insufficient():
    farmer = FarmerListing(
        id="f1", crop="Tomatoes", quantity_kg=1200, quality_grade=1,
        asking_price_per_kg=30.0, lat=18.5204, lng=73.8567, harvest_date=date(2026, 8, 20)
    )
    buyer = BuyerProcurement(
        id="b1", crop_needed="Tomatoes", min_quality_grade=2, budget_per_kg=40.0,
        lat=18.9894, lng=73.1175, max_radius_km=150.0, needed_by=date(2026, 8, 25)
    )
    transporter = TransporterCapacity(
        id="t1", capacity_kg=800, current_lat=18.6, current_lng=73.9,
        max_radius_km=150.0, available_from=date(2026, 8, 19), available_to=date(2026, 8, 25)
    )

    passed, reason = passes_gates(farmer, buyer, transporter)
    assert not passed
    assert "capacity" in reason.lower()


def test_gate_4_refrigeration_missing():
    farmer = FarmerListing(
        id="f1", crop="Strawberries", quantity_kg=300, quality_grade=1,
        asking_price_per_kg=120.0, lat=18.5204, lng=73.8567, harvest_date=date(2026, 8, 20),
        needs_refrigeration=True
    )
    buyer = BuyerProcurement(
        id="b1", crop_needed="Strawberries", min_quality_grade=1, budget_per_kg=160.0,
        lat=18.9894, lng=73.1175, max_radius_km=150.0, needed_by=date(2026, 8, 25)
    )
    transporter = TransporterCapacity(
        id="t1", capacity_kg=500, current_lat=18.6, current_lng=73.9,
        max_radius_km=150.0, available_from=date(2026, 8, 19), available_to=date(2026, 8, 25),
        has_refrigeration=False
    )

    passed, reason = passes_gates(farmer, buyer, transporter)
    assert not passed
    assert "refrigeration" in reason.lower()


def test_gate_5_radius_exceeded():
    # Farmer in Pune, Buyer in Delhi (> 1000 km), buyer max_radius 150 km
    farmer = FarmerListing(
        id="f1", crop="Tomatoes", quantity_kg=500, quality_grade=1,
        asking_price_per_kg=30.0, lat=18.5204, lng=73.8567, harvest_date=date(2026, 8, 20)
    )
    buyer = BuyerProcurement(
        id="b1", crop_needed="Tomatoes", min_quality_grade=2, budget_per_kg=40.0,
        lat=28.6139, lng=77.2090, max_radius_km=150.0, needed_by=date(2026, 8, 25)
    )
    transporter = TransporterCapacity(
        id="t1", capacity_kg=1000, current_lat=18.6, current_lng=73.9,
        max_radius_km=150.0, available_from=date(2026, 8, 19), available_to=date(2026, 8, 25)
    )

    passed, reason = passes_gates(farmer, buyer, transporter)
    assert not passed
    assert "range" in reason.lower() or "radius" in reason.lower()


# ===========================================================================
# 2. 3 HAND-LABELED SCENARIOS & SCORING ACCURACY
# ===========================================================================

def test_scenario_a_perfect_match():
    # Farmer in Shirwal, Buyer in Navi Mumbai (80 km), Transporter in Pune (nearby)
    farmer = FarmerListing(
        id="f-shirwal", crop="Tomatoes", quantity_kg=500, quality_grade=1,
        asking_price_per_kg=32.0, lat=18.1500, lng=74.0000, harvest_date=date(2026, 8, 20)
    )
    buyer = BuyerProcurement(
        id="b-mumbai", crop_needed="Tomatoes", min_quality_grade=1, budget_per_kg=45.0,
        lat=19.0330, lng=73.0297, max_radius_km=200.0, needed_by=date(2026, 8, 23)
    )
    transporter = TransporterCapacity(
        id="t-pune", capacity_kg=1000, current_lat=18.5204, current_lng=73.8567,
        max_radius_km=250.0, available_from=date(2026, 8, 20), available_to=date(2026, 8, 24)
    )

    engine = CrossRoleMatchEngine()
    score, subs = engine.score_triple(farmer, buyer, transporter)

    assert score is not None
    assert score >= 0.70, f"Expected high score for perfect match, got {score}"
    assert subs["price_fit"] > 0.8
    assert subs["timing_fit"] > 0.8
    assert subs["route_fit"] > 0.65
    assert subs["capacity_fit"] > 0.7
    assert subs["ml_utility"] > 0.5

    exp = explain(score, subs)
    assert "score" in exp.lower() and "strongest" in exp.lower()


def test_scenario_b_marginal_match():
    # Tight price fit, longer transit distance, close timing
    farmer = FarmerListing(
        id="f-marginal", crop="Onions", quantity_kg=800, quality_grade=2,
        asking_price_per_kg=28.0, lat=19.9975, lng=73.7898, harvest_date=date(2026, 8, 20) # Nashik
    )
    buyer = BuyerProcurement(
        id="b-marginal", crop_needed="Onions", min_quality_grade=2, budget_per_kg=32.0,
        lat=18.5204, lng=73.8567, max_radius_km=250.0, needed_by=date(2026, 8, 21) # Pune, tight deadline
    )
    transporter = TransporterCapacity(
        id="t-marginal", capacity_kg=850, current_lat=19.8, current_lng=73.9,
        max_radius_km=300.0, available_from=date(2026, 8, 20), available_to=date(2026, 8, 21)
    )

    engine = CrossRoleMatchEngine()
    score, subs = engine.score_triple(farmer, buyer, transporter)

    assert score is not None
    # Score should pass but reflect tighter margins
    assert 0.45 <= score <= 0.85
    exp = explain(score, subs)
    assert len(exp) > 20


def test_scenario_c_unviable_price_fit():
    # Farmer asking 50 + transport ~ 6 = 56, Buyer budget only 35
    farmer = FarmerListing(
        id="f-expensive", crop="Tomatoes", quantity_kg=500, quality_grade=1,
        asking_price_per_kg=50.0, lat=18.5204, lng=73.8567, harvest_date=date(2026, 8, 20)
    )
    buyer = BuyerProcurement(
        id="b-cheap", crop_needed="Tomatoes", min_quality_grade=1, budget_per_kg=35.0,
        lat=18.9894, lng=73.1175, max_radius_km=150.0, needed_by=date(2026, 8, 24)
    )
    transporter = TransporterCapacity(
        id="t-norm", capacity_kg=1000, current_lat=18.6, current_lng=73.9,
        max_radius_km=150.0, available_from=date(2026, 8, 20), available_to=date(2026, 8, 24)
    )

    engine = CrossRoleMatchEngine()
    score, subs = engine.score_triple(farmer, buyer, transporter)

    assert score is not None
    # Price fit should be penalized heavily
    assert subs["price_fit"] < 0.35
    assert score <= 0.65


# ===========================================================================
# 3. LOCALIZED EXPLANATIONS (ENGLISH, HINDI, MARATHI)
# ===========================================================================

def test_localized_explanations():
    score = 0.88
    subs = {
        "price_fit": 0.90,
        "timing_fit": 0.85,
        "route_fit": 0.92,
        "capacity_fit": 0.86,
        "transport_cost_per_kg": 4.2,
    }

    en = explain_localized(score, subs, lang="en")
    hi = explain_localized(score, subs, lang="hi")
    mr = explain_localized(score, subs, lang="mr")

    assert "88%" in en
    assert "88%" in hi
    assert "88%" in mr

    # Hindi should contain Devanagari characters
    assert any('\u0900' <= ch <= '\u097F' for ch in hi)
    # Marathi should contain Devanagari characters
    assert any('\u0900' <= ch <= '\u097F' for ch in mr)
    # Marathi specific vocabulary
    assert "साम्य गुण" in mr or "मार्ग" in mr or "घटक" in mr


# ===========================================================================
# 4. FAILURE PATH TESTS (PART 7)
# ===========================================================================

def test_failure_path_no_buyer_match():
    service = MatchOrchestrationService()
    farmer = FarmerListing(
        id="f1", crop="Pomegranates", quantity_kg=500, quality_grade=1,
        asking_price_per_kg=80.0, lat=18.5204, lng=73.8567, harvest_date=date(2026, 8, 20)
    )
    # Open orders exist, but only for Tomatoes and Onions
    buyers = [
        BuyerProcurement(id="b1", crop_needed="Tomatoes", min_quality_grade=1, budget_per_kg=40.0, lat=18.9, lng=73.1, max_radius_km=100.0, needed_by=date(2026, 8, 24)),
        BuyerProcurement(id="b2", crop_needed="Onions", min_quality_grade=1, budget_per_kg=30.0, lat=18.9, lng=73.1, max_radius_km=100.0, needed_by=date(2026, 8, 24)),
    ]
    transporters = [
        TransporterCapacity(id="t1", capacity_kg=1000, current_lat=18.6, current_lng=73.9, max_radius_km=150.0, available_from=date(2026, 8, 20), available_to=date(2026, 8, 24))
    ]

    with pytest.raises(OrchestrationFailureException) as exc_info:
        service.match_farmer_produce(farmer, buyers, transporters)

    assert exc_info.value.code == "NO_BUYER_MATCH"
    assert "Pomegranates" in exc_info.value.message
    assert "hi" in exc_info.value.localized_messages
    assert "mr" in exc_info.value.localized_messages


def test_failure_path_no_transporter_match():
    service = MatchOrchestrationService()
    farmer = FarmerListing(
        id="f1", crop="Tomatoes", quantity_kg=4500, quality_grade=1, # 4.5 MT
        asking_price_per_kg=30.0, lat=18.5204, lng=73.8567, harvest_date=date(2026, 8, 20)
    )
    buyers = [
        BuyerProcurement(id="b1", crop_needed="Tomatoes", min_quality_grade=1, budget_per_kg=40.0, lat=18.9, lng=73.1, max_radius_km=100.0, needed_by=date(2026, 8, 24))
    ]
    # Only small 1 MT pickup available
    transporters = [
        TransporterCapacity(id="t1", capacity_kg=1000, current_lat=18.6, current_lng=73.9, max_radius_km=150.0, available_from=date(2026, 8, 20), available_to=date(2026, 8, 24))
    ]

    with pytest.raises(OrchestrationFailureException) as exc_info:
        service.match_farmer_produce(farmer, buyers, transporters)

    assert exc_info.value.code == "NO_TRANSPORTER_MATCH"
    assert "4500" in exc_info.value.message
    assert "hi" in exc_info.value.localized_messages
    assert "mr" in exc_info.value.localized_messages


# ===========================================================================
# 5. MULTI-PARTY CONSENT & GOVERNANCE TESTS
# ===========================================================================

def test_multi_party_governance_partial_pending():
    service = MatchOrchestrationService()
    farmer = FarmerListing(id="f1", crop="Tomatoes", quantity_kg=500, quality_grade=1, asking_price_per_kg=30.0, lat=18.5, lng=73.8, harvest_date=date(2026, 8, 20))
    buyer = BuyerProcurement(id="b1", crop_needed="Tomatoes", min_quality_grade=1, budget_per_kg=40.0, lat=18.9, lng=73.1, max_radius_km=100.0, needed_by=date(2026, 8, 24))
    transporter = TransporterCapacity(id="t1", capacity_kg=1000, current_lat=18.6, current_lng=73.9, max_radius_km=150.0, available_from=date(2026, 8, 20), available_to=date(2026, 8, 24))

    proposal, err = service.create_proposal_from_triple(farmer, buyer, transporter)
    assert proposal is not None
    assert proposal.status == MatchProposalStatus.PROPOSED

    # Farmer approves
    ok, msg, p = service.submit_decision(proposal.id, "FARMER", PartyDecision.APPROVED)
    assert ok
    assert p.farmer_status == PartyDecision.APPROVED
    assert p.buyer_status == PartyDecision.PENDING
    assert p.status == MatchProposalStatus.PROPOSED


def test_multi_party_governance_decline_rollback():
    service = MatchOrchestrationService()
    farmer = FarmerListing(id="f1", crop="Tomatoes", quantity_kg=500, quality_grade=1, asking_price_per_kg=30.0, lat=18.5, lng=73.8, harvest_date=date(2026, 8, 20))
    buyer = BuyerProcurement(id="b1", crop_needed="Tomatoes", min_quality_grade=1, budget_per_kg=40.0, lat=18.9, lng=73.1, max_radius_km=100.0, needed_by=date(2026, 8, 24))
    transporter = TransporterCapacity(id="t1", capacity_kg=1000, current_lat=18.6, current_lng=73.9, max_radius_km=150.0, available_from=date(2026, 8, 20), available_to=date(2026, 8, 24))

    proposal, _ = service.create_proposal_from_triple(farmer, buyer, transporter)

    # Farmer approves
    service.submit_decision(proposal.id, "FARMER", PartyDecision.APPROVED)

    # Transporter declines
    ok, msg, p = service.submit_decision(proposal.id, "TRANSPORTER", PartyDecision.DECLINED, reason="Vehicle maintenance")
    assert ok
    assert p.transporter_status == PartyDecision.DECLINED
    assert p.status == MatchProposalStatus.DECLINED
    assert "declined" in msg.lower() and "transporter" in msg.lower()

    # Further approvals should be rejected
    ok2, msg2, _ = service.submit_decision(proposal.id, "BUYER", PartyDecision.APPROVED)
    assert not ok2
    assert "closed" in msg2.lower() or "declined" in msg2.lower()


def test_multi_party_governance_timeout_expiration():
    service = MatchOrchestrationService()
    farmer = FarmerListing(id="f1", crop="Tomatoes", quantity_kg=500, quality_grade=1, asking_price_per_kg=30.0, lat=18.5, lng=73.8, harvest_date=date(2026, 8, 20))
    buyer = BuyerProcurement(id="b1", crop_needed="Tomatoes", min_quality_grade=1, budget_per_kg=40.0, lat=18.9, lng=73.1, max_radius_km=100.0, needed_by=date(2026, 8, 24))
    transporter = TransporterCapacity(id="t1", capacity_kg=1000, current_lat=18.6, current_lng=73.9, max_radius_km=150.0, available_from=date(2026, 8, 20), available_to=date(2026, 8, 24))

    proposal, _ = service.create_proposal_from_triple(farmer, buyer, transporter)

    # Artificially expire the proposal
    proposal.expires_at = datetime.now(timezone.utc) - timedelta(minutes=5)

    expired_list = MultiPartyGovernanceEngine.check_and_expire_proposals([proposal])
    assert len(expired_list) == 1
    assert proposal.status == MatchProposalStatus.EXPIRED

    # Cannot approve expired proposal
    ok, msg = MultiPartyGovernanceEngine.record_decision(proposal, "FARMER", PartyDecision.APPROVED)
    assert not ok
    assert "expired" in msg.lower()


def test_three_party_consensus_triggers_java_authority():
    service = MatchOrchestrationService()
    farmer = FarmerListing(id="f1", crop="Tomatoes", quantity_kg=500, quality_grade=1, asking_price_per_kg=30.0, lat=18.5, lng=73.8, harvest_date=date(2026, 8, 20))
    buyer = BuyerProcurement(id="b1", crop_needed="Tomatoes", min_quality_grade=1, budget_per_kg=40.0, lat=18.9, lng=73.1, max_radius_km=100.0, needed_by=date(2026, 8, 24))
    transporter = TransporterCapacity(id="t1", capacity_kg=1000, current_lat=18.6, current_lng=73.9, max_radius_km=150.0, available_from=date(2026, 8, 20), available_to=date(2026, 8, 24))

    proposal, _ = service.create_proposal_from_triple(farmer, buyer, transporter)

    # 1. Farmer approves
    service.submit_decision(proposal.id, "FARMER", PartyDecision.APPROVED)
    # 2. Buyer approves
    service.submit_decision(proposal.id, "BUYER", PartyDecision.APPROVED)
    # 3. Transporter approves -> triggers 3-party consensus & Java authority mutation!
    ok, msg, p = service.submit_decision(proposal.id, "TRANSPORTER", PartyDecision.APPROVED)

    assert ok
    assert "Three-party consensus reached" in msg
    assert p.farmer_status == PartyDecision.APPROVED
    assert p.buyer_status == PartyDecision.APPROVED
    assert p.transporter_status == PartyDecision.APPROVED
    assert p.status == MatchProposalStatus.CONFIRMED
    assert p.confirmed_booking_id is not None
