# Goal Management & Lifecycle Types (Phase 4 Python Core)
from enum import Enum
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from datetime import datetime


class GoalType(str, Enum):
    MOVE_PRODUCE = "MOVE_PRODUCE"
    LIST_PRODUCE = "LIST_PRODUCE"
    CHECK_MARKET_PRICE = "CHECK_MARKET_PRICE"
    CHECK_DEMAND = "CHECK_DEMAND"
    POST_PROCUREMENT = "POST_PROCUREMENT"
    BROWSE_PRODUCE = "BROWSE_PRODUCE"
    FIND_LOADS = "FIND_LOADS"
    ACCEPT_TRIP = "ACCEPT_TRIP"
    REGISTER_VEHICLE = "REGISTER_VEHICLE"
    CHECK_EARNINGS = "CHECK_EARNINGS"
    LOGIN = "LOGIN"
    GENERAL_QUERY = "GENERAL_QUERY"


class GoalStatus(str, Enum):
    IDENTIFIED = "IDENTIFIED"
    INFORMATION_GATHERING = "INFORMATION_GATHERING"
    PLANNING = "PLANNING"
    PREDICTING = "PREDICTING"
    CONFIRMATION_PENDING = "CONFIRMATION_PENDING"
    EXECUTING = "EXECUTING"
    VERIFYING = "VERIFYING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    ABORTED = "ABORTED"


class Subtask(BaseModel):
    id: str
    description: str
    status: str = "PENDING"  # PENDING, IN_PROGRESS, COMPLETED, FAILED
    tool_name: Optional[str] = None
    result: Optional[Any] = None


class Goal(BaseModel):
    goal_id: str
    goal_type: GoalType
    role: str
    status: GoalStatus = GoalStatus.IDENTIFIED
    entities: Dict[str, Any] = Field(default_factory=dict)
    missing_entities: List[str] = Field(default_factory=list)
    subtasks: List[Subtask] = Field(default_factory=list)
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now().isoformat())
