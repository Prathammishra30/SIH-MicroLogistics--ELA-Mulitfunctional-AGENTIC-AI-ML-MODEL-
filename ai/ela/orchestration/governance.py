# ELA Multi-Party Governance Engine (Cross-Role Consent & Lifecycle State Machine)
# Enforces explicit three-party approval (Farmer + Buyer + Transporter)
# Guarantees clean rollback on decline and expiration without partial/ghost transactions

import uuid
from enum import Enum
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel, Field


class PartyDecision(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    DECLINED = "DECLINED"


class MatchProposalStatus(str, Enum):
    PROPOSED = "PROPOSED"            # Awaiting decisions from one or more parties
    ALL_APPROVED = "ALL_APPROVED"    # All 3 parties approved, ready for Java Authority mutation
    DECLINED = "DECLINED"            # At least one party declined, rolled back
    EXPIRED = "EXPIRED"              # Proposal timed out without full consent, rolled back
    CONFIRMED = "CONFIRMED"          # Dispatched via Java Authority and verified in PostgreSQL


class MatchProposal(BaseModel):
    id: str = Field(default_factory=lambda: f"prop-{uuid.uuid4().hex[:8]}")
    farmer_id: str
    buyer_id: str
    transporter_id: str
    product_id: Optional[str] = None
    procurement_id: Optional[str] = None
    vehicle_id: Optional[str] = None

    crop: str
    quantity_kg: float
    asking_price_per_kg: float
    target_price_per_kg: float
    transport_cost_per_kg: float
    total_cost_per_kg: float
    match_score: float
    sub_scores: Dict[str, Any] = Field(default_factory=dict)
    explanation: str

    farmer_status: PartyDecision = PartyDecision.PENDING
    buyer_status: PartyDecision = PartyDecision.PENDING
    transporter_status: PartyDecision = PartyDecision.PENDING
    status: MatchProposalStatus = MatchProposalStatus.PROPOSED

    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    expires_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc) + timedelta(hours=24))
    confirmed_booking_id: Optional[str] = None
    audit_log: List[Dict[str, Any]] = Field(default_factory=list)

    @property
    def booking_id(self) -> Optional[str]:
        return self.confirmed_booking_id

    @booking_id.setter
    def booking_id(self, val: Optional[str]):
        self.confirmed_booking_id = val


class MultiPartyGovernanceEngine:
    """
    State machine governing 3-party proposal consent, rollback, and timeout.
    """

    @classmethod
    def record_decision(
        cls,
        proposal: MatchProposal,
        role: str,
        decision: PartyDecision,
        reason: Optional[str] = None,
        current_time: Optional[datetime] = None,
    ) -> Tuple[bool, str]:
        now = current_time or datetime.now(timezone.utc)

        # 1. Validate Proposal Active State
        if proposal.status in [MatchProposalStatus.DECLINED, MatchProposalStatus.EXPIRED, MatchProposalStatus.CONFIRMED]:
            return False, f"Proposal is already closed with status: {proposal.status.value}"

        # 2. Check Expiration
        if now > proposal.expires_at:
            proposal.status = MatchProposalStatus.EXPIRED
            proposal.audit_log.append({
                "action": "EXPIRED",
                "timestamp": now.isoformat(),
                "reason": "Proposal timeout window exceeded"
            })
            return False, "Proposal has expired"

        norm_role = role.upper().strip()
        timestamp = now.isoformat()

        # 3. Handle Decline -> Instant Clean Rollback
        if decision == PartyDecision.DECLINED:
            if norm_role == "FARMER":
                proposal.farmer_status = PartyDecision.DECLINED
            elif norm_role == "BUYER":
                proposal.buyer_status = PartyDecision.DECLINED
            elif norm_role == "TRANSPORTER":
                proposal.transporter_status = PartyDecision.DECLINED
            else:
                return False, f"Invalid participant role: {role}"

            proposal.status = MatchProposalStatus.DECLINED
            proposal.audit_log.append({
                "action": "DECLINE",
                "role": norm_role,
                "timestamp": timestamp,
                "reason": reason or "Declined by participant",
                "rollback": True,
            })
            return True, f"Proposal declined by {norm_role}. Reservation released cleanly."

        # 4. Handle Approval
        if decision == PartyDecision.APPROVED:
            if norm_role == "FARMER":
                proposal.farmer_status = PartyDecision.APPROVED
            elif norm_role == "BUYER":
                proposal.buyer_status = PartyDecision.APPROVED
            elif norm_role == "TRANSPORTER":
                proposal.transporter_status = PartyDecision.APPROVED
            else:
                return False, f"Invalid participant role: {role}"

            proposal.audit_log.append({
                "action": "APPROVE",
                "role": norm_role,
                "timestamp": timestamp,
            })

            # Check if all 3 parties have approved
            if (
                proposal.farmer_status == PartyDecision.APPROVED and
                proposal.buyer_status == PartyDecision.APPROVED and
                proposal.transporter_status == PartyDecision.APPROVED
            ):
                proposal.status = MatchProposalStatus.ALL_APPROVED
                proposal.audit_log.append({
                    "action": "ALL_APPROVED",
                    "timestamp": timestamp,
                    "message": "All three parties approved. Ready for authoritative execution."
                })
                return True, "Three-party consensus achieved! Ready for confirmation."

            pending_roles = []
            if proposal.farmer_status == PartyDecision.PENDING:
                pending_roles.append("FARMER")
            if proposal.buyer_status == PartyDecision.PENDING:
                pending_roles.append("BUYER")
            if proposal.transporter_status == PartyDecision.PENDING:
                pending_roles.append("TRANSPORTER")

            return True, f"Approval recorded for {norm_role}. Awaiting: {', '.join(pending_roles)}."

        return False, f"Unrecognized decision type: {decision}"

    @classmethod
    def check_expiration(
        cls,
        proposal: MatchProposal,
        current_time: Optional[datetime] = None,
    ) -> bool:
        now = current_time or datetime.now(timezone.utc)
        if proposal.status == MatchProposalStatus.PROPOSED and now > proposal.expires_at:
            proposal.status = MatchProposalStatus.EXPIRED
            proposal.audit_log.append({
                "action": "EXPIRED",
                "timestamp": now.isoformat(),
                "reason": "Proposal timeout window elapsed"
            })
            return True
        return False

    @classmethod
    def check_and_expire_proposals(
        cls,
        proposals: List[MatchProposal],
        current_time: Optional[datetime] = None,
    ) -> List[MatchProposal]:
        now = current_time or datetime.now(timezone.utc)
        expired = []
        for p in proposals:
            if cls.check_expiration(p, now):
                expired.append(p)
        return expired

    @classmethod
    def mark_confirmed(
        cls,
        proposal: MatchProposal,
        booking_id: str,
        current_time: Optional[datetime] = None,
    ) -> Tuple[bool, str]:
        if proposal.status != MatchProposalStatus.ALL_APPROVED:
            return False, f"Cannot confirm proposal: required status ALL_APPROVED, current: {proposal.status.value}"

        now = current_time or datetime.now(timezone.utc)
        proposal.status = MatchProposalStatus.CONFIRMED
        proposal.confirmed_booking_id = booking_id
        proposal.audit_log.append({
            "action": "CONFIRMED",
            "booking_id": booking_id,
            "timestamp": now.isoformat(),
        })
        return True, f"Match confirmed into production logistics request: {booking_id}"

    @classmethod
    def invalidate_proposal(
        cls,
        proposal: MatchProposal,
        reason: str = "Invalidated by system or participant",
    ) -> bool:
        proposal.status = MatchProposalStatus.DECLINED
        proposal.audit_log.append({
            "action": "INVALIDATED",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "reason": reason,
            "rollback": True,
        })
        return True
