# Goal Decomposition Engine (Phase 4 Python Core)
from typing import List, Dict, Any
from ai.ela.goals.goal import GoalType, Subtask


class GoalDecomposer:
    @staticmethod
    def decompose(goal_type: GoalType, entities: Dict[str, Any]) -> List[Subtask]:
        """
        Decomposes a top-level goal into actionable sequential subtasks.
        """
        if goal_type == GoalType.MOVE_PRODUCE:
            return [
                Subtask(id="task-1", description="Validate cargo commodity, quantity, and grade"),
                Subtask(id="task-2", description="Determine origin pickup and destination locations"),
                Subtask(id="task-3", description="Search available fleet & match vehicle capacity", tool_name="get_available_trips"),
                Subtask(id="task-4", description="Calculate freight cost, transit ETA, and carbon score"),
                Subtask(id="task-5", description="Rank best vehicle match with decision support reasoning"),
                Subtask(id="task-6", description="Request user confirmation for logistics dispatch", tool_name="request_transport"),
                Subtask(id="task-7", description="Execute authorized transaction through Java backend"),
                Subtask(id="task-8", description="Verify post-database record in PostgreSQL"),
            ]

        if goal_type == GoalType.POST_PROCUREMENT:
            return [
                Subtask(id="task-1", description="Validate procurement crop, quantity, and target price"),
                Subtask(id="task-2", description="Predict spot price variance and market arrival trends"),
                Subtask(id="task-3", description="Request user confirmation for posting procurement demand", tool_name="post_procurement"),
                Subtask(id="task-4", description="Execute authorized transaction through Java backend"),
                Subtask(id="task-5", description="Verify post-database record in PostgreSQL"),
            ]

        if goal_type == GoalType.LIST_PRODUCE:
            return [
                Subtask(id="task-1", description="Validate crop name, quantity, category, and harvest date"),
                Subtask(id="task-2", description="Calculate price recommendation from APMC trends"),
                Subtask(id="task-3", description="Request user confirmation to add crop to inventory", tool_name="add_product"),
                Subtask(id="task-4", description="Execute transaction & verify inventory database state"),
            ]

        if goal_type == GoalType.FIND_LOADS:
            return [
                Subtask(id="task-1", description="Identify transporter vehicle type, capacity, and current region"),
                Subtask(id="task-2", description="Fetch unassigned farmer shipments", tool_name="get_available_trips"),
                Subtask(id="task-3", description="Filter trips matching vehicle capacity and route compatibility"),
                Subtask(id="task-4", description="Calculate estimated earnings and transit duration"),
                Subtask(id="task-5", description="Present ranked trip options to transporter"),
            ]

        return [
            Subtask(id="task-1", description=f"Execute query for {goal_type.value}")
        ]
