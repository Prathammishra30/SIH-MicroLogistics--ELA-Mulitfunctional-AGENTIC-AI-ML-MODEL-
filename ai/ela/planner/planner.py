# Goal Decomposition & Subtask Planning Engine (Phase 4 Python Core)
import time
from typing import List, Dict, Any, Optional
from ai.ela.agent.state import GoalPlan, SubTask, UserRole, ElaIntent, CanonicalEntities
from ai.ela.intent.types import CanonicalIntent


class GoalManager:
    @classmethod
    def decompose_goal(
        cls,
        intent: ElaIntent,
        entities: CanonicalEntities,
        role: UserRole,
        raw_prompt: str,
    ) -> GoalPlan:
        goal_id = f"goal-{int(time.time() * 1000)}"
        subtasks: List[SubTask] = []

        if intent == 'CREATE_LOGISTICS_WORKFLOW':
            subtasks = [
                SubTask(
                    id=f"{goal_id}-step-1",
                    name="Validate Produce & Destination",
                    description="Verify produce quantity and destination mandi for shipment",
                    tool_name="validate_shipment_details",
                    is_consequential=False,
                    required_entities=['product', 'quantity', 'destination'],
                    payload={'product': entities.product, 'quantity': entities.quantity, 'destination': entities.destination},
                ),
                SubTask(
                    id=f"{goal_id}-step-2",
                    name="Calculate Trip ETA & Transport Cost",
                    description="Compute estimated transit duration and transport fare",
                    tool_name="predict_eta_cost",
                    is_consequential=False,
                    required_entities=['destination'],
                    payload={'destination': entities.destination, 'weightKg': entities.quantity or 500},
                ),
                SubTask(
                    id=f"{goal_id}-step-3",
                    name="Stage Logistics Transport Request",
                    description="Stage transport request card awaiting farmer confirmation",
                    tool_name="create_logistics_request",
                    is_consequential=True,
                    required_entities=['product', 'quantity', 'destination'],
                    payload={'productName': entities.product or 'Produce', 'quantity': entities.quantity or 500, 'destination': entities.destination or 'Pune Mandi'},
                ),
            ]
            title = f"Arrange Transport for {entities.product or 'Produce'} to {entities.destination or 'Mandi'}"

        elif intent == 'CREATE_PRODUCT_WORKFLOW':
            subtasks = [
                SubTask(
                    id=f"{goal_id}-step-1",
                    name="Validate Crop Listing Parameters",
                    description="Check crop category, grade, and initial quantity",
                    tool_name="validate_produce_batch",
                    is_consequential=False,
                    required_entities=['product'],
                    payload={'cropName': entities.product, 'quantity': entities.quantity or 500, 'grade': entities.grade or 'A'},
                ),
                SubTask(
                    id=f"{goal_id}-step-2",
                    name="Stage Produce Batch to Inventory",
                    description="Stage confirmed addition of produce batch to farmer inventory",
                    tool_name="create_product",
                    is_consequential=True,
                    required_entities=['product'],
                    payload={'name': entities.product, 'quantity': entities.quantity or 500, 'grade': entities.grade or 'A'},
                ),
            ]
            title = f"List New Produce Batch: {entities.product or 'Crop'}"

        elif intent == 'CREATE_PROCUREMENT_WORKFLOW':
            subtasks = [
                SubTask(
                    id=f"{goal_id}-step-1",
                    name="Stage Buyer Procurement Demand",
                    description="Stage procurement demand posting awaiting buyer confirmation",
                    tool_name="create_procurement",
                    is_consequential=True,
                    required_entities=['product', 'quantity'],
                    payload={'cropName': entities.product, 'quantityRequired': entities.quantity or 500, 'targetPrice': entities.price_per_unit or 40},
                ),
            ]
            title = f"Post Procurement Demand for {entities.product or 'Produce'}"

        elif intent == 'CREATE_VEHICLE_WORKFLOW':
            subtasks = [
                SubTask(
                    id=f"{goal_id}-step-1",
                    name="Stage Fleet Vehicle Registration",
                    description="Stage addition of vehicle awaiting transporter confirmation",
                    tool_name="create_vehicle",
                    is_consequential=True,
                    required_entities=['vehicle_type'],
                    payload={'vehicleType': entities.vehicle_type or 'Mini Truck (750 kg)', 'vehicleRegNo': entities.vehicle_reg_no or 'MH 12 AB 9876'},
                ),
            ]
            title = f"Register Vehicle: {entities.vehicle_type or 'Truck'}"

        else:
            # Single action or conversational intent
            subtasks = [
                SubTask(
                    id=f"{goal_id}-step-1",
                    name="Execute Intent Query",
                    description=f"Process {intent}",
                    tool_name=intent.lower(),
                    is_consequential=False,
                )
            ]
            title = f"Process {intent}"

        strat = getattr(entities, 'strategy', 'BALANCED') or 'BALANCED'
        return GoalPlan(
            goal_id=goal_id,
            title=title,
            original_prompt=raw_prompt,
            role=role,
            strategy=strat,
            status='PLANNING',
            subtasks=subtasks,
        )


class PlannedStep:
    def __init__(self, step_number: int, tool_name: str, arguments: Dict[str, Any], is_consequential: bool = False):
        self.step_number = step_number
        self.tool_name = tool_name
        self.arguments = arguments
        self.is_consequential = is_consequential


class ExecutionPlan:
    def __init__(self, is_executable: bool, steps: List[PlannedStep], denial_reason: Optional[str] = None):
        self.is_executable = is_executable
        self.steps = steps
        self.denial_reason = denial_reason


class AgentPlanner:
    # Strict RBAC tool permissions matrix
    ROLE_PERMISSIONS: Dict[str, List[UserRole]] = {
        'get_farmer_products': ['FARMER'],
        'create_product': ['FARMER'],
        'create_logistics_request': ['FARMER'],
        'get_farmer_deliveries': ['FARMER'],
        'get_buyer_produce': ['BUYER'],
        'create_procurement': ['BUYER'],
        'get_buyer_orders': ['BUYER'],
        'get_available_trips': ['TRANSPORTER'],
        'get_active_trips': ['TRANSPORTER'],
        'get_vehicles': ['TRANSPORTER'],
        'create_vehicle': ['TRANSPORTER'],
        'get_earnings': ['TRANSPORTER'],
        'get_market_demand': ['FARMER', 'BUYER', 'TRANSPORTER', 'GUEST'],
        'explain_platform': ['FARMER', 'BUYER', 'TRANSPORTER', 'GUEST'],
        'general_help': ['FARMER', 'BUYER', 'TRANSPORTER', 'GUEST'],
        'login_guidance': ['FARMER', 'BUYER', 'TRANSPORTER', 'GUEST'],
        'role_declaration': ['FARMER', 'BUYER', 'TRANSPORTER', 'GUEST'],
    }

    @classmethod
    def plan(cls, canonical: CanonicalIntent, context_role: UserRole) -> ExecutionPlan:
        intent = canonical.intent
        tool_name = cls.resolve_tool_for_intent(intent)

        # 1. Non-tool Conversational Intents
        if intent in ['GENERAL_HELP', 'EXPLAIN_PLATFORM', 'ROLE_DECLARATION', 'LOGIN_GUIDANCE']:
            return ExecutionPlan(is_executable=False, steps=[])

        # 2. RBAC Permission Validation
        allowed_roles = cls.ROLE_PERMISSIONS.get(tool_name, [])
        if context_role == 'GUEST' and tool_name not in ['get_market_demand']:
            return ExecutionPlan(
                is_executable=False,
                steps=[],
                denial_reason="Please sign in to your account to perform this action.",
            )

        if context_role not in allowed_roles and 'GUEST' not in allowed_roles:
            role_names = ", ".join(allowed_roles)
            return ExecutionPlan(
                is_executable=False,
                steps=[],
                denial_reason=f"Access Denied: This action requires the {role_names} role. Your current role is {context_role}.",
            )

        # 3. Construct Steps
        steps: List[PlannedStep] = []
        is_consequential = tool_name in ['create_product', 'create_logistics_request', 'create_procurement', 'create_vehicle']

        steps.append(
            PlannedStep(
                step_number=1,
                tool_name=tool_name,
                arguments=canonical.entities.model_dump(exclude_none=True),
                is_consequential=is_consequential,
            )
        )

        return ExecutionPlan(is_executable=True, steps=steps)

    @classmethod
    def resolve_tool_for_intent(cls, intent: ElaIntent) -> str:
        mapping = {
            'GET_FARMER_PRODUCTS': 'get_farmer_products',
            'CREATE_PRODUCT_WORKFLOW': 'create_product',
            'CREATE_LOGISTICS_WORKFLOW': 'create_logistics_request',
            'GET_FARMER_DELIVERIES': 'get_farmer_deliveries',
            'GET_MARKET_DEMAND': 'get_market_demand',
            'GET_BUYER_PRODUCE': 'get_buyer_produce',
            'CREATE_PROCUREMENT_WORKFLOW': 'create_procurement',
            'GET_BUYER_ORDERS': 'get_buyer_orders',
            'GET_AVAILABLE_TRIPS': 'get_available_trips',
            'GET_ACTIVE_TRIPS': 'get_active_trips',
            'GET_VEHICLES': 'get_vehicles',
            'CREATE_VEHICLE_WORKFLOW': 'create_vehicle',
            'GET_EARNINGS': 'get_earnings',
        }
        return mapping.get(intent, 'general_help')
