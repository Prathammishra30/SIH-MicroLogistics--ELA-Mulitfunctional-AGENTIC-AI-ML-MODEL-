# Base Specialized Agent Interface (Phase 9 Multi-Agent Orchestration)
import abc
import time
from typing import List, Optional
from ai.ela.agents.contracts import AgentRequest, AgentResponse, AgentStatus
from ai.ela.agent.state import UserRole


class BaseSpecializedAgent(abc.ABC):
    """
    Abstract base class for all specialized worker agents controlled by ONE ELA.
    """

    def __init__(
        self,
        agent_id: str,
        capabilities: List[str],
        allowed_roles: Optional[List[UserRole]] = None,
        allowed_tools: Optional[List[str]] = None,
        dependencies: Optional[List[str]] = None,
    ):
        self.agent_id = agent_id
        self.capabilities = capabilities
        self.allowed_roles = allowed_roles or ['GUEST', 'FARMER', 'BUYER', 'TRANSPORTER']
        self.allowed_tools = allowed_tools or []
        self.dependencies = dependencies or []

    def can_handle(self, request: AgentRequest) -> bool:
        """Checks whether this agent is authorized and suited to handle the request."""
        if request.role not in self.allowed_roles and 'GUEST' not in self.allowed_roles:
            return False
        return True

    async def run(self, request: AgentRequest) -> AgentResponse:
        """Executes the agent task with timing, validation, and error recovery."""
        start_time = time.time()
        if not self.can_handle(request):
            return AgentResponse(
                agent_id=self.agent_id,
                task_id=request.task_id,
                status='SKIPPED',
                reasoning_summary=f"{self.agent_id} skipped task due to role/capability mismatch.",
                execution_time_ms=0.0,
            )

        try:
            resp = await self.execute(request)
            resp.execution_time_ms = round((time.time() - start_time) * 1000, 2)
            return resp
        except Exception as exc:
            return await self.handle_failure(request, exc, round((time.time() - start_time) * 1000, 2))

    @abc.abstractmethod
    async def execute(self, request: AgentRequest) -> AgentResponse:
        """Core agent execution logic."""
        pass

    async def handle_failure(self, request: AgentRequest, exc: Exception, duration_ms: float) -> AgentResponse:
        """Graceful error recovery without hallucinating or faking results."""
        return AgentResponse(
            agent_id=self.agent_id,
            task_id=request.task_id,
            status='FAILED',
            error_message=str(exc),
            confidence=0.0,
            reasoning_summary=f"{self.agent_id} encountered execution failure: {str(exc)}",
            warnings=[f"Capability {self.agent_id} was unavailable."],
            execution_time_ms=duration_ms,
        )
