# ELA Python Agent State & Trace Definitions (Phase 4 Python Core)
from typing import Dict, List, Any, Optional, Literal
from pydantic import BaseModel, Field
from datetime import datetime

UserRole = Literal['GUEST', 'FARMER', 'BUYER', 'TRANSPORTER', 'ADMIN']
SupportedLanguage = Literal['en', 'hi', 'mr', 'ta', 'te', 'bn', 'kn']

ElaIntent = Literal[
    'GENERAL_HELP',
    'EXPLAIN_PLATFORM',
    'ROLE_DECLARATION',
    'LOGIN_GUIDANCE',
    'GET_FARMER_PRODUCTS',
    'CREATE_PRODUCT_WORKFLOW',
    'CREATE_LOGISTICS_WORKFLOW',
    'GET_FARMER_DELIVERIES',
    'GET_MARKET_DEMAND',
    'GET_BUYER_PRODUCE',
    'CREATE_PROCUREMENT_WORKFLOW',
    'GET_BUYER_ORDERS',
    'GET_AVAILABLE_TRIPS',
    'GET_ACTIVE_TRIPS',
    'GET_VEHICLES',
    'CREATE_VEHICLE_WORKFLOW',
    'GET_EARNINGS',
    'SECURITY_SHIELD',
    'UNKNOWN',
]

AgentOutcome = Literal[
    'SUCCESS',
    'NEEDS_CLARIFICATION',
    'CONFIRMATION_REQUIRED',
    'UNAUTHORIZED',
    'TOOL_FAILURE',
    'SERVICE_UNAVAILABLE',
    'GOAL_INCOMPLETE',
    'GOAL_COMPLETED',
    'CREDENTIAL_SHIELDED',
]


class ConfidenceScore(BaseModel):
    intent_confidence: float = 1.0
    entity_confidence: float = 1.0
    language_confidence: float = 1.0
    role_confidence: float = 1.0
    overall_confidence: float = 1.0


class CanonicalEntities(BaseModel):
    product: Optional[str] = None
    commodity: Optional[str] = None
    quantity: Optional[float] = None
    unit: Optional[str] = None
    destination: Optional[str] = None
    pickup_location: Optional[str] = None
    price_per_unit: Optional[float] = None
    grade: Optional[str] = None
    vehicle_type: Optional[str] = None
    vehicle_reg_no: Optional[str] = None
    strategy: str = 'BALANCED'


class SafetyCheckResult(BaseModel):
    credential_shielded: bool = False
    prompt_injection_detected: bool = False
    unauthorized_attempt: bool = False
    rbac_violation: bool = False
    sanitized: bool = True
    warnings: List[str] = Field(default_factory=list)

    @property
    def is_safe(self) -> bool:
        return not (self.credential_shielded or self.prompt_injection_detected or self.unauthorized_attempt or self.rbac_violation)


class StepObservation(BaseModel):
    step_index: int
    tool_name: str
    arguments: Dict[str, Any] = Field(default_factory=dict)
    success: bool
    result_data: Optional[Any] = None
    error: Optional[str] = None
    duration_ms: float = 0.0
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())


class SubTask(BaseModel):
    id: str
    name: str
    description: str
    tool_name: str
    status: Literal['PENDING', 'EXECUTING', 'WAITING_CONFIRMATION', 'COMPLETED', 'FAILED'] = 'PENDING'
    is_consequential: bool = False
    required_entities: List[str] = Field(default_factory=list)
    payload: Dict[str, Any] = Field(default_factory=dict)
    result: Optional[Any] = None


class GoalPlan(BaseModel):
    goal_id: str
    title: str
    original_prompt: str
    role: UserRole
    strategy: str = 'BALANCED'
    constraints: Dict[str, Any] = Field(default_factory=dict)
    status: Literal['PLANNING', 'IN_PROGRESS', 'COMPLETED', 'FAILED'] = 'PLANNING'
    subtasks: List[SubTask] = Field(default_factory=list)
    current_subtask_index: int = 0
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now().isoformat())


class AgentExecutionTrace(BaseModel):
    trace_id: str
    session_id: str
    user_id: Optional[str] = None
    authenticated_role: UserRole = 'GUEST'
    conversational_role: UserRole = 'GUEST'
    language: SupportedLanguage = 'en'
    input_message: str
    intent: ElaIntent = 'GENERAL_HELP'
    goal_title: Optional[str] = None
    strategy: str = 'BALANCED'
    lifecycle_stage: str = 'RESPONDING'
    confidence: ConfidenceScore = Field(default_factory=ConfidenceScore)
    planner_steps: List[Dict[str, Any]] = Field(default_factory=list)
    selected_tools: List[str] = Field(default_factory=list)
    tool_results: List[Dict[str, Any]] = Field(default_factory=list)
    models_used: List[str] = Field(default_factory=list)
    predictions_summary: Optional[Dict[str, Any]] = None
    decision_trace: Optional[Dict[str, Any]] = None
    verification_status: str = 'VERIFIED'
    learning_event_created: bool = False
    model_provider: str = 'PythonRuleBasedCanonicalProvider'
    model_version: str = 'ela-py-v8.1'
    total_latency_ms: float = 0.0
    transformer: Optional[Dict[str, Any]] = None
    memory: Optional[Dict[str, Any]] = None
    planning: Optional[Dict[str, Any]] = None
    final_outcome: AgentOutcome = 'SUCCESS'
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())


class ElaAgentState(BaseModel):
    session_id: str
    trace_id: str
    user_id: Optional[str] = None
    authenticated: bool = False
    authenticated_role: UserRole = 'GUEST'
    conversational_role: UserRole = 'GUEST'
    language: SupportedLanguage = 'en'
    conversation_history: List[Dict[str, str]] = Field(default_factory=list)
    current_intent: ElaIntent = 'GENERAL_HELP'
    target_domain: Literal['farmer', 'buyer', 'transporter', 'universal', 'auth'] = 'universal'
    extracted_entities: CanonicalEntities = Field(default_factory=CanonicalEntities)
    confidence: ConfidenceScore = Field(default_factory=ConfidenceScore)
    safety_flags: SafetyCheckResult = Field(default_factory=SafetyCheckResult)
    active_goal: Optional[GoalPlan] = None
    subtasks: List[SubTask] = Field(default_factory=list)
    current_task_index: int = 0
    step_observations: List[StepObservation] = Field(default_factory=list)
    pending_action: Optional[Dict[str, Any]] = None
    navigation_action: Optional[Dict[str, Any]] = None
    requires_confirmation: bool = False
    clarification_needed: bool = False
    clarification_question: Optional[str] = None
    prediction_context: Optional[Dict[str, Any]] = None
    iterations: int = 0
    status: Literal['INITIALIZING', 'PLANNING', 'EXECUTING', 'WAITING_CONFIRMATION', 'CLARIFYING', 'COMPLETED', 'FAILED'] = 'INITIALIZING'
