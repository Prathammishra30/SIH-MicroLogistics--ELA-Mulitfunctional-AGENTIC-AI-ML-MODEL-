# ELA Agent Lifecycle & Execution State Machine (Phase 4 Python Core)
from enum import Enum
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from datetime import datetime


class AgentStage(str, Enum):
    IDLE = "IDLE"
    LISTENING = "LISTENING"
    DETECTING_LANGUAGE = "DETECTING_LANGUAGE"
    UNDERSTANDING = "UNDERSTANDING"
    IDENTIFYING_GOAL = "IDENTIFYING_GOAL"
    PLANNING = "PLANNING"
    PREDICTING = "PREDICTING"
    EVALUATING_OPTIONS = "EVALUATING_OPTIONS"
    WAITING_CONFIRMATION = "WAITING_CONFIRMATION"
    EXECUTING = "EXECUTING"
    VERIFYING = "VERIFYING"
    LEARNING = "LEARNING"
    RESPONDING = "RESPONDING"
    COMPLETED = "COMPLETED"
    ERROR = "ERROR"


class LifecycleTrace(BaseModel):
    session_id: str
    stage: AgentStage = AgentStage.IDLE
    language: str = "hi"
    role: str = "GUEST"
    goal: Optional[str] = None
    step_history: List[str] = Field(default_factory=list)
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())

    def transition_to(self, new_stage: AgentStage, description: Optional[str] = None):
        self.stage = new_stage
        entry = f"[{new_stage.value}] {description or ''}".strip()
        self.step_history.append(entry)
