# ELA Learning Event & Data Schemas (Phase 7 Real-World Learning & Continuous Intelligence)
from typing import Dict, Any, List, Optional, Literal
from pydantic import BaseModel, Field
from datetime import datetime


DatasetType = Literal["SYNTHETIC", "SYNTHETIC_TEST", "REAL_OPERATIONAL", "MIXED"]
DatasetPartition = Literal["TRAIN", "VALIDATION", "HOLDOUT"]
UserRoleType = Literal["FARMER", "BUYER", "TRANSPORTER", "GUEST", "ADMIN"]
FeedbackSourceType = Literal["USER_FEEDBACK", "OPERATIONAL_FEEDBACK", "BUSINESS_OUTCOME"]


class LearningEvent(BaseModel):
    """
    Standardized Learning Record capturing real-world operational interactions and feedback.
    Sanitized to ensure zero confidential secrets or auth credentials are ever stored.
    """
    event_id: str = Field(default_factory=lambda: f"evt-{datetime.now().strftime('%Y%m%d%H%M%S')}")
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())
    user_role: UserRoleType = "GUEST"
    operation_type: str  # LOGISTICS_REQUEST, PRODUCT_LISTING, PROCUREMENT_DEMAND, TRIP_EXECUTION
    prediction_type: str  # ETA_MINUTES, TRANSPORT_COST, DEMAND_KG, SPOT_PRICE, VEHICLE_MATCH, DELAY_RISK
    features: Dict[str, Any]
    predicted_value: Any
    actual_value: Optional[Any] = None
    error_delta: Optional[float] = None
    error_percentage: Optional[float] = None
    outcome: Optional[str] = None  # COMPLETED, DELAYED, CANCELLED, REJECTED
    feedback_text: Optional[str] = None
    user_rating: Optional[int] = None
    route_context: Optional[str] = None
    model_name: str
    model_version: str
    confidence: float = 0.9
    dataset_partition: DatasetPartition = "TRAIN"
    dataset_type: DatasetType = "REAL_OPERATIONAL"


class ExplicitUserFeedback(BaseModel):
    session_id: str
    user_id: Optional[str] = None
    user_role: UserRoleType = "GUEST"
    model_name: str
    rating: int  # 1 to 5 stars
    feedback_category: str  # ACCURACY, SPEED, PRICE, VEHICLE_FIT, ROUTE
    feedback_text: str
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())


class ImplicitOperationalFeedback(BaseModel):
    operation_id: str
    session_id: str
    model_name: str
    model_version: str
    predicted_value: float
    actual_value: float
    route: Optional[str] = None
    vehicle_type: Optional[str] = None
    weather_condition: Optional[str] = None
    traffic_level: Optional[str] = None
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())


class BusinessOutcomeFeedback(BaseModel):
    transaction_id: str
    transaction_type: str  # TRIP_COMPLETED, ORDER_FULFILLED, BOOKING_CANCELLED
    expected_freight: Optional[float] = None
    final_settled_freight: Optional[float] = None
    scheduled_eta_minutes: Optional[int] = None
    actual_duration_minutes: Optional[int] = None
    cancellation_reason: Optional[str] = None
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())


class DataQualityReport(BaseModel):
    total_records_checked: int
    valid_records_count: int
    invalid_records_count: int
    outliers_detected: int
    leakage_detected: bool
    temporal_order_valid: bool
    validation_status: Literal["PASSED", "WARNING", "FAILED"]
    issues: List[str] = Field(default_factory=list)
    evaluated_at: str = Field(default_factory=lambda: datetime.now().isoformat())
