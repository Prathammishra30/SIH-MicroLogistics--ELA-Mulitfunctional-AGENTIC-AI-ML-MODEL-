# Goal Lifecycle Manager (Phase 4 Python Core)
import uuid
from typing import Dict, Any, Optional
from ai.ela.goals.goal import Goal, GoalType, GoalStatus
from ai.ela.goals.decomposition import GoalDecomposer


class GoalManager:
    """
    Manages active agent goals across multi-turn sessions.
    """
    def __init__(self):
        self._active_goals: Dict[str, Goal] = {}

    def create_goal(self, goal_type: GoalType, role: str, entities: Dict[str, Any]) -> Goal:
        goal_id = f"goal-{uuid.uuid4().hex[:8]}"
        subtasks = GoalDecomposer.decompose(goal_type, entities)
        
        # Check missing entities
        missing = []
        if goal_type == GoalType.MOVE_PRODUCE:
            if not entities.get("commodity") and not entities.get("crop_name"):
                missing.append("commodity")
            if not entities.get("quantity") and not entities.get("quantity_kg"):
                missing.append("quantity")
            if not entities.get("destination"):
                missing.append("destination")
        
        status = GoalStatus.INFORMATION_GATHERING if missing else GoalStatus.PLANNING

        goal = Goal(
            goal_id=goal_id,
            goal_type=goal_type,
            role=role,
            status=status,
            entities=entities,
            missing_entities=missing,
            subtasks=subtasks
        )
        self._active_goals[goal_id] = goal
        return goal

    def update_goal_entities(self, goal_id: str, new_entities: Dict[str, Any]) -> Optional[Goal]:
        goal = self._active_goals.get(goal_id)
        if not goal:
            return None
        goal.entities.update(new_entities)
        
        # Recheck missing
        if goal.goal_type == GoalType.MOVE_PRODUCE:
            goal.missing_entities = [
                k for k in ["commodity", "quantity", "destination"]
                if not goal.entities.get(k) and not goal.entities.get(f"{k}_kg")
            ]
            if not goal.missing_entities:
                goal.status = GoalStatus.PLANNING

        return goal

    def complete_goal(self, goal_id: str) -> Optional[Goal]:
        goal = self._active_goals.get(goal_id)
        if goal:
            goal.status = GoalStatus.COMPLETED
        return goal
