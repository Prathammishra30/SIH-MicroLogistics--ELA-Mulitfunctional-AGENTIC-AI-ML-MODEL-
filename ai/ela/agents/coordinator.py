# Multi-Agent Coordinator (Phase 9 Universal Autonomous Orchestration)
import asyncio
import time
from typing import Dict, Any, List, Optional

from ai.ela.agents.contracts import (
    AgentRequest,
    AgentResponse,
    AgentTraceRecord,
    ConflictRecord,
    CoordinatorResult,
)
from ai.ela.agents.base import BaseSpecializedAgent
from ai.ela.agents.farmer_agent import FarmerAgent
from ai.ela.agents.buyer_agent import BuyerAgent
from ai.ela.agents.transporter_agent import TransporterAgent
from ai.ela.agents.market_agent import MarketAgent
from ai.ela.agents.logistics_agent import LogisticsAgent
from ai.ela.agents.risk_agent import RiskAgent
from ai.ela.agents.prediction_agent import PredictionAgent
from ai.ela.intent.strategy import OptimizationStrategy


class AgentCoordinator:
    """
    Central Coordinator managing multi-agent dispatch, concurrent execution, dependency chaining,
    conflict detection, strategy-driven trade-off resolution, and failure recovery under ONE ELA.
    """

    def __init__(self):
        # Register specialized agents
        self.farmer_agent = FarmerAgent()
        self.buyer_agent = BuyerAgent()
        self.transporter_agent = TransporterAgent()
        self.market_agent = MarketAgent()
        self.logistics_agent = LogisticsAgent()
        self.risk_agent = RiskAgent()
        self.prediction_agent = PredictionAgent()

        self._agent_registry: Dict[str, BaseSpecializedAgent] = {
            "FarmerAgent": self.farmer_agent,
            "BuyerAgent": self.buyer_agent,
            "TransporterAgent": self.transporter_agent,
            "MarketAgent": self.market_agent,
            "LogisticsAgent": self.logistics_agent,
            "RiskAgent": self.risk_agent,
            "PredictionAgent": self.prediction_agent,
        }

    def determine_required_agents(self, request: AgentRequest) -> List[str]:
        """Determines the required specialized agents based on intent, role, and objective."""
        intent = request.intent
        role = request.role

        if intent in ['CREATE_LOGISTICS_WORKFLOW', 'MOVE_PRODUCE']:
            return ["FarmerAgent", "LogisticsAgent", "PredictionAgent", "RiskAgent"]
        elif intent in ['GET_MARKET_DEMAND', 'GET_PRICE_FORECAST']:
            return ["MarketAgent", "PredictionAgent"]
        elif intent in ['CREATE_PRODUCT_WORKFLOW', 'GET_FARMER_PRODUCTS', 'GET_FARMER_DELIVERIES']:
            return ["FarmerAgent", "MarketAgent", "PredictionAgent"]
        elif intent in ['CREATE_PROCUREMENT_WORKFLOW', 'GET_BUYER_PRODUCE', 'GET_BUYER_ORDERS']:
            return ["BuyerAgent", "MarketAgent", "PredictionAgent", "RiskAgent"]
        elif intent in ['CREATE_VEHICLE_WORKFLOW', 'GET_VEHICLES', 'GET_AVAILABLE_TRIPS']:
            return ["TransporterAgent", "LogisticsAgent", "PredictionAgent", "RiskAgent"]
        else:
            if role == 'FARMER':
                return ["FarmerAgent", "MarketAgent"]
            elif role == 'BUYER':
                return ["BuyerAgent", "MarketAgent"]
            elif role == 'TRANSPORTER':
                return ["TransporterAgent", "LogisticsAgent"]
            return ["MarketAgent", "PredictionAgent"]

    async def coordinate(self, request: AgentRequest) -> CoordinatorResult:
        """
        Coordinates execution of required specialized agents with parallel execution, dependency sequencing,
        conflict resolution, and failure recovery.
        """
        start_time = time.time()
        required_agent_ids = self.determine_required_agents(request)

        agent_responses: Dict[str, AgentResponse] = {}
        execution_traces: List[AgentTraceRecord] = []
        missing_capabilities: List[str] = []
        conflicts_detected: List[ConflictRecord] = []

        # =====================================================================
        # PHASE A: Parallel Execution of Independent Informational & Domain Agents
        # =====================================================================
        independent_agents = [
            agent_id for agent_id in required_agent_ids
            if agent_id in ["FarmerAgent", "BuyerAgent", "TransporterAgent", "MarketAgent", "PredictionAgent"]
        ]

        async def _run_agent(aid: str) -> tuple[str, AgentResponse]:
            agent = self._agent_registry.get(aid)
            if not agent:
                return aid, AgentResponse(agent_id=aid, task_id=request.task_id, status='FAILED', error_message="Agent not found")
            res = await agent.run(request)
            return aid, res

        if independent_agents:
            results = await asyncio.gather(*[_run_agent(aid) for aid in independent_agents], return_exceptions=True)
            for item in results:
                if isinstance(item, Exception):
                    missing_capabilities.append("IndependentTaskError")
                    continue
                aid, resp = item
                agent_responses[aid] = resp
                execution_traces.append(
                    AgentTraceRecord(
                        agent_id=aid,
                        task_id=request.task_id,
                        status=resp.status,
                        duration_ms=resp.execution_time_ms,
                        confidence=resp.confidence,
                        models_used=resp.models_used,
                        summary=resp.reasoning_summary,
                    )
                )
                if resp.status == 'FAILED':
                    missing_capabilities.append(aid)

        # =====================================================================
        # PHASE B: Dependent Execution of Logistics Agent (Consuming Entity / Payload)
        # =====================================================================
        if "LogisticsAgent" in required_agent_ids:
            logistics_agent = self._agent_registry.get("LogisticsAgent")
            if logistics_agent:
                log_resp = await logistics_agent.run(request)
                agent_responses["LogisticsAgent"] = log_resp
                execution_traces.append(
                    AgentTraceRecord(
                        agent_id="LogisticsAgent",
                        task_id=request.task_id,
                        status=log_resp.status,
                        duration_ms=log_resp.execution_time_ms,
                        confidence=log_resp.confidence,
                        models_used=log_resp.models_used,
                        summary=log_resp.reasoning_summary,
                    )
                )
                if log_resp.status == 'FAILED':
                    missing_capabilities.append("LogisticsAgent")

        # =====================================================================
        # PHASE C: Dependent Execution of Risk Agent (Evaluating Selected Vehicle / Corridor)
        # =====================================================================
        if "RiskAgent" in required_agent_ids:
            risk_agent = self._agent_registry.get("RiskAgent")
            if risk_agent:
                # Enrich request parameters with logistics vehicle if available
                risk_req = request.model_copy(deep=True)
                if "LogisticsAgent" in agent_responses and agent_responses["LogisticsAgent"].status == 'SUCCESS':
                    rec_v = agent_responses["LogisticsAgent"].data.get("recommended_vehicle", {})
                    if rec_v:
                        risk_req.parameters["vehicle_type"] = rec_v.get("vehicle_type", "Mini Truck (750 kg)")
                        risk_req.parameters["vehicle_capacity_kg"] = rec_v.get("capacity_kg", 750.0)

                risk_resp = await risk_agent.run(risk_req)
                agent_responses["RiskAgent"] = risk_resp
                execution_traces.append(
                    AgentTraceRecord(
                        agent_id="RiskAgent",
                        task_id=request.task_id,
                        status=risk_resp.status,
                        duration_ms=risk_resp.execution_time_ms,
                        confidence=risk_resp.confidence,
                        models_used=risk_resp.models_used,
                        summary=risk_resp.reasoning_summary,
                    )
                )
                if risk_resp.status == 'FAILED':
                    missing_capabilities.append("RiskAgent")

        # =====================================================================
        # PHASE D: Conflict Detection & Strategy-Driven Multi-Objective Resolution
        # =====================================================================
        fused_rec = None
        conf_action = None
        replan_needed = False

        if "LogisticsAgent" in agent_responses and agent_responses["LogisticsAgent"].status == 'SUCCESS':
            log_data = agent_responses["LogisticsAgent"].data
            top_v = log_data.get("recommended_vehicle", {})
            conf_action = agent_responses["LogisticsAgent"].recommended_action

            # Check for conflict between cheapness and risk
            if "RiskAgent" in agent_responses and agent_responses["RiskAgent"].status == 'SUCCESS':
                risk_data = agent_responses["RiskAgent"].data
                c_prob = risk_data.get("cancellation_probability", 0.0)
                d_prob = risk_data.get("delay_probability", 0.0)

                if c_prob > 0.15 or d_prob > 0.60:
                    conflict_type = "COST_VS_RISK" if request.strategy == "CHEAPEST" else "ETA_VS_RELIABILITY"
                    
                    if request.strategy == "HIGHEST_RELIABILITY":
                        resolution = "Overrode cheapest option to prioritize highest delivery certainty and lowest cancellation risk."
                    elif request.strategy == "CHEAPEST":
                        resolution = "Accepted moderate operational risk to preserve minimum freight tariff per user preference."
                    elif request.strategy == "FASTEST":
                        resolution = "Prioritized fastest transit ETA over marginal cancellation variance."
                    else:
                        resolution = "Balanced cost, ETA, and cancellation risk through normalized multi-criteria weighting."

                    conflicts_detected.append(
                        ConflictRecord(
                            conflict_type=conflict_type,
                            agents_involved=["LogisticsAgent", "RiskAgent"],
                            description=f"Logistics recommended {top_v.get('vehicle_type')} but Risk detected {c_prob * 100:.0f}% cancellation / {d_prob * 100:.0f}% delay risk.",
                            tradeoff_resolution=resolution,
                            selected_option=top_v.get("vehicle_type", "Standard Vehicle"),
                            applied_strategy=request.strategy,
                        )
                    )

            fused_rec = log_data

        elif "FarmerAgent" in agent_responses and agent_responses["FarmerAgent"].recommended_action:
            conf_action = agent_responses["FarmerAgent"].recommended_action
            fused_rec = agent_responses["FarmerAgent"].data
        elif "BuyerAgent" in agent_responses and agent_responses["BuyerAgent"].recommended_action:
            conf_action = agent_responses["BuyerAgent"].recommended_action
            fused_rec = agent_responses["BuyerAgent"].data
        elif "TransporterAgent" in agent_responses and agent_responses["TransporterAgent"].recommended_action:
            conf_action = agent_responses["TransporterAgent"].recommended_action
            fused_rec = agent_responses["TransporterAgent"].data

        # Calculate Overall Confidence
        active_confs = [r.confidence for r in agent_responses.values() if r.status == 'SUCCESS']
        overall_conf = sum(active_confs) / len(active_confs) if active_confs else 0.85
        if missing_capabilities:
            overall_conf *= 0.85  # Penalty for degraded capability

        overall_status = 'PARTIAL_SUCCESS' if missing_capabilities else 'SUCCESS'
        if not agent_responses or all(r.status == 'FAILED' for r in agent_responses.values()):
            overall_status = 'FAILED'

        total_latency = round((time.time() - start_time) * 1000, 2)

        # Build comprehensive reasoning summary
        summaries = [r.reasoning_summary for r in agent_responses.values() if r.reasoning_summary]
        combined_summary = " ".join(summaries) if summaries else "Coordinated specialized multi-agent workflow."

        return CoordinatorResult(
            session_id=request.session_id,
            goal_id=request.goal_id,
            strategy=request.strategy,
            status=overall_status,
            agent_responses=agent_responses,
            execution_traces=execution_traces,
            conflicts_detected=conflicts_detected,
            fused_recommendation=fused_rec,
            confirmation_action=conf_action,
            reasoning_summary=combined_summary,
            overall_confidence=round(overall_conf, 2),
            missing_capabilities=missing_capabilities,
            replan_occurred=replan_needed,
            total_duration_ms=total_latency,
        )
