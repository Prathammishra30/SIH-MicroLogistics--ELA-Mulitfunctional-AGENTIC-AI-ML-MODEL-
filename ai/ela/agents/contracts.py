# Agent Communication Contracts (Phase 9 Universal Multi-Agent Orchestration)
from typing import Dict, Any, List, Optional, Literal
from pydantic import BaseModel, Field
from datetime import datetime

from ai.ela.agent.state import UserRole, SupportedLanguage, CanonicalEntities, ElaIntent
from ai.ela.intent.strategy import OptimizationStrategy

AgentStatus = Literal['SUCCESS', 'FAILED', 'PARTIAL_SUCCESS', 'NEEDS_INPUT', 'SKIPPED']
RiskLevel = Literal['LOW', 'MODERATE', 'HIGH', 'CRITICAL']


class AgentRequest(BaseModel):
    task_id: str
    session_id: str
    goal_id: str
    role: UserRole = 'GUEST'
    language: SupportedLanguage = 'en'
    intent: ElaIntent = 'GENERAL_HELP'
    objective: str
    entities: CanonicalEntities = Field(default_factory=CanonicalEntities)
    constraints: Dict[str, Any] = Field(default_factory=dict)
    strategy: OptimizationStrategy = 'BALANCED'
    parameters: Dict[str, Any] = Field(default_factory=dict)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())


class AgentResponse(BaseModel):
    agent_id: str
    task_id: str
    status: AgentStatus = 'SUCCESS'
    data: Dict[str, Any] = Field(default_factory=dict)
    confidence: float = 1.0
    reasoning_summary: str = ""
    warnings: List[str] = Field(default_factory=list)
    models_used: List[str] = Field(default_factory=list)
    recommended_action: Optional[Dict[str, Any]] = None
    execution_time_ms: float = 0.0
    error_message: Optional[str] = None
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())


class AgentTraceRecord(BaseModel):
    agent_id: str
    task_id: str
    status: AgentStatus
    duration_ms: float
    confidence: float
    models_used: List[str] = Field(default_factory=list)
    summary: str = ""


class ConflictRecord(BaseModel):
    conflict_type: Literal['COST_VS_RISK', 'COST_VS_ETA', 'ETA_VS_RELIABILITY', 'CAPACITY_MISMATCH', 'DATA_DISCREPANCY']
    agents_involved: List[str]
    description: str
    tradeoff_resolution: str
    selected_option: str
    applied_strategy: OptimizationStrategy


class CoordinatorResult(BaseModel):
    session_id: str
    goal_id: str
    strategy: OptimizationStrategy
    status: AgentStatus
    agent_responses: Dict[str, AgentResponse] = Field(default_factory=dict)
    execution_traces: List[AgentTraceRecord] = Field(default_factory=list)
    conflicts_detected: List[ConflictRecord] = Field(default_factory=list)
    fused_recommendation: Optional[Dict[str, Any]] = None
    confirmation_action: Optional[Dict[str, Any]] = None
    reasoning_summary: str = ""
    overall_confidence: float = 0.90
    missing_capabilities: List[str] = Field(default_factory=list)
    replan_occurred: bool = False
    total_duration_ms: float = 0.0
