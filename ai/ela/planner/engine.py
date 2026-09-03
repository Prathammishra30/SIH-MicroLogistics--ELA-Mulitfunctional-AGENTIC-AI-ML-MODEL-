# ELA Agentic Plan Generation Engine (Phase 12.3)
from typing import Dict, Any, List, Optional
import uuid

from ai.ela.planner.models import ElaPlan, ElaPlanStep
from ai.ela.memory.context import ElaCognitiveContext


class AgenticPlanner:
    """
    Constructs machine-executable structured plans from cognitive context,
    active goal, Transformer representations, and user optimization strategies.
    Generates explicit DAGs with owner agents, authorization gates, and verification criteria.
    """

    PLANNER_VERSION = "ela-agentic-planner-v12.3"

    @classmethod
    def create_plan(
        cls,
        cognitive_ctx: ElaCognitiveContext,
        transformer_state: Dict[str, Any],
        goal_id: str,
        objective: str,
        role: str,
        strategy: str,
        entities: Dict[str, Any],
    ) -> ElaPlan:
        plan_id = f"plan-{uuid.uuid4().hex[:8]}"
        steps: List[ElaPlanStep] = []
        risks: List[Dict[str, Any]] = []
        authorization_reqs: List[str] = []

        comm = entities.get("commodity") or entities.get("product") or "Produce"
        qty = float(entities.get("quantity") or 500.0)
        origin = entities.get("pickup_location") or "Nashik"
        dest = entities.get("destination") or "Pune APMC Mandi"
        intent = cognitive_ctx.to_transformer_memory_features().get("intent", "CREATE_LOGISTICS_WORKFLOW")

        # Decision score from Transformer Neural Core
        t_score = transformer_state.get("decision_score", 0.75)
        t_version = transformer_state.get("model_version", "v1.0-transformer-core")

        # ---------------------------------------------------------------------
        # 1. Logistics Transport Planning (Farmer / Logistics)
        # ---------------------------------------------------------------------
        if "transport" in objective.lower() or "logistics" in objective.lower() or role == "FARMER" and "move" in objective.lower():
            s1_id = f"{plan_id}-step-1"
            s2_id = f"{plan_id}-step-2"
            s3_id = f"{plan_id}-step-3"
            s4_id = f"{plan_id}-step-4"
            s5_id = f"{plan_id}-step-5"

            # Step 1: Tariffs & ETA Prediction (PredictionAgent)
            steps.append(
                ElaPlanStep(
                    step_id=s1_id,
                    order=1,
                    name="Predict Corridor Freight & ETA",
                    objective=f"Compute ML-hybrid freight tariffs and transit duration from {origin} to {dest}",
                    owner_agent="PredictionAgent",
                    required_tools=["predict_eta_cost"],
                    inputs={"origin": origin, "destination": dest, "weight_kg": qty, "commodity": comm},
                    expected_outputs={"estimated_cost": 2800.0, "estimated_eta_minutes": 187.0},
                    dependencies=[],
                    risk_level="LOW",
                    authorization_required=False,
                    verification_required=False,
                )
            )

            # Step 2: Delay & Cancellation Risk Assessment (RiskAgent)
            steps.append(
                ElaPlanStep(
                    step_id=s2_id,
                    order=2,
                    name="Assess Route & Transporter Risk",
                    objective=f"Evaluate monsoon weather delays and carrier cancellation risk on corridor {origin}-{dest}",
                    owner_agent="RiskAgent",
                    required_tools=["assess_route_delay_risk"],
                    inputs={"origin": origin, "destination": dest, "strategy": strategy},
                    expected_outputs={"delay_probability": 0.12, "cancellation_probability": 0.05},
                    dependencies=[],
                    risk_level="LOW" if strategy == "HIGHEST_RELIABILITY" else "MODERATE",
                    authorization_required=False,
                    verification_required=False,
                )
            )

            # Step 3: Multi-Objective Vehicle Matching (LogisticsAgent)
            steps.append(
                ElaPlanStep(
                    step_id=s3_id,
                    order=3,
                    name="Multi-Objective Vehicle Matching",
                    objective=f"Rank compatible fleet vehicles for {qty} kg {comm} under {strategy} strategy",
                    owner_agent="LogisticsAgent",
                    required_tools=["rank_transport_options"],
                    inputs={"weight_kg": qty, "commodity": comm, "strategy": strategy, "origin": origin, "destination": dest},
                    expected_outputs={"recommended_vehicle": "Mini Truck (750 kg)"},
                    dependencies=[s1_id, s2_id],
                    risk_level="LOW",
                    authorization_required=False,
                    verification_required=False,
                )
            )

            # Step 4: Stage Recommendation Card (FarmerAgent) - Authorization Gate!
            steps.append(
                ElaPlanStep(
                    step_id=s4_id,
                    order=4,
                    name="Stage Transport Booking Recommendation",
                    objective="Stage transport recommendation card for user review and explicit confirmation",
                    owner_agent="FarmerAgent",
                    required_tools=["stage_farmer_recommendation"],
                    inputs={"strategy": strategy, "commodity": comm, "quantity": qty},
                    expected_outputs={"staged_confirmation": True},
                    dependencies=[s3_id],
                    risk_level="LOW",
                    authorization_required=True,
                    verification_required=False,
                )
            )

            # Step 5: Authoritative Booking Commit (Java Authority Tool Bridge)
            steps.append(
                ElaPlanStep(
                    step_id=s5_id,
                    order=5,
                    name="Commit Booking to Java Authority",
                    objective="Execute booking request through Node bridge to Java Authority & PostgreSQL",
                    owner_agent="LogisticsAgent",
                    required_tools=["create_logistics_request"],
                    inputs={"productName": comm, "quantity": qty, "destination": dest, "origin": origin},
                    expected_outputs={"booking_id": "req-authoritative"},
                    dependencies=[s4_id],
                    risk_level="HIGH",
                    authorization_required=True,
                    verification_required=True,
                    idempotency_key=f"idemp-{plan_id}-{s5_id}",
                )
            )

            authorization_reqs.append("User explicit approval required before staging or executing transport booking.")
            if strategy == "CHEAPEST":
                risks.append({"risk": "Tariff minimization may accept higher delay variance", "mitigation": "Highlight ETA trade-off to user"})
            else:
                risks.append({"risk": "High reliability carrier selection carries tariff premium", "mitigation": "Show price breakdown in confirmation card"})

        # ---------------------------------------------------------------------
        # 2. Buyer Procurement Demand Planning
        # ---------------------------------------------------------------------
        elif role == "BUYER" or "procurement" in objective.lower() or "buy" in objective.lower():
            s1_id = f"{plan_id}-step-1"
            s2_id = f"{plan_id}-step-2"
            s3_id = f"{plan_id}-step-3"

            steps.append(
                ElaPlanStep(
                    step_id=s1_id,
                    order=1,
                    name="Validate Procurement Parameters",
                    objective=f"Verify bulk purchase volume and target price for {comm}",
                    owner_agent="BuyerAgent",
                    required_tools=["validate_procurement_demand"],
                    inputs={"commodity": comm, "quantity": qty},
                    dependencies=[],
                    authorization_required=False,
                )
            )
            steps.append(
                ElaPlanStep(
                    step_id=s2_id,
                    order=2,
                    name="Fetch APMC Mandi Price Trends",
                    objective="Retrieve real-time market trading rates for crop valuation",
                    owner_agent="MarketAgent",
                    required_tools=["get_market_demand"],
                    inputs={"commodity": comm, "mandi": dest},
                    dependencies=[],
                    authorization_required=False,
                )
            )
            steps.append(
                ElaPlanStep(
                    step_id=s3_id,
                    order=3,
                    name="Stage Procurement Posting to Java Authority",
                    objective="Stage verified purchase demand to marketplace via Java Authority",
                    owner_agent="BuyerAgent",
                    required_tools=["create_procurement"],
                    inputs={"cropName": comm, "quantityRequired": qty},
                    dependencies=[s1_id, s2_id],
                    authorization_required=True,
                    verification_required=True,
                    idempotency_key=f"idemp-{plan_id}-{s3_id}",
                )
            )
            authorization_reqs.append("Buyer confirmation required to post procurement commitment to marketplace.")

        # ---------------------------------------------------------------------
        # 3. Transporter Fleet & Trip Planning
        # ---------------------------------------------------------------------
        elif role == "TRANSPORTER" or "vehicle" in objective.lower() or "trip" in objective.lower():
            s1_id = f"{plan_id}-step-1"
            s2_id = f"{plan_id}-step-2"

            steps.append(
                ElaPlanStep(
                    step_id=s1_id,
                    order=1,
                    name="Inspect Vehicle & Capacity Specifications",
                    objective="Validate vehicle payload, dimensions, and registration parameters",
                    owner_agent="TransporterAgent",
                    required_tools=["validate_transporter_bid"],
                    inputs={"vehicle_type": entities.get("vehicle_type", "Mini Truck (750 kg)")},
                    dependencies=[],
                    authorization_required=False,
                )
            )
            steps.append(
                ElaPlanStep(
                    step_id=s2_id,
                    order=2,
                    name="Commit Vehicle Fleet Registration",
                    objective="Register vehicle in verified fleet registry through Java Authority",
                    owner_agent="TransporterAgent",
                    required_tools=["create_vehicle"],
                    inputs={"vehicleType": entities.get("vehicle_type", "Mini Truck (750 kg)")},
                    dependencies=[s1_id],
                    authorization_required=True,
                    verification_required=True,
                    idempotency_key=f"idemp-{plan_id}-{s2_id}",
                )
            )
            authorization_reqs.append("Transporter confirmation required for vehicle addition.")

        # ---------------------------------------------------------------------
        # 4. Fallback / Single Action Inquiry
        # ---------------------------------------------------------------------
        else:
            steps.append(
                ElaPlanStep(
                    step_id=f"{plan_id}-step-1",
                    order=1,
                    name="Execute Conversational Guidance",
                    objective=objective,
                    owner_agent="MarketAgent",
                    required_tools=["get_market_demand"],
                    inputs={},
                    dependencies=[],
                    authorization_required=False,
                )
            )

        return ElaPlan(
            plan_id=plan_id,
            version=1,
            parent_version=None,
            goal_id=goal_id,
            session_id=cognitive_ctx.session_id,
            user_id=cognitive_ctx.user_id,
            status="READY",
            objective=objective,
            strategy=strategy,
            context_snapshot_id=cognitive_ctx.context_id,
            transformer_model_version=t_version,
            planner_version=cls.PLANNER_VERSION,
            steps=steps,
            constraints={"strategy": strategy, "commodity": comm, "origin": origin, "destination": dest},
            risks=risks,
            authorization_requirements=authorization_reqs,
            expected_outcome={"objective": objective, "transformer_readiness_score": t_score},
        )
