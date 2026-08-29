# ELA Core Agent Coordinator (Phase 4 Python Core)
from typing import Dict, Any, Optional
from ai.ela.agent.loop import AgentLoop
from ai.ela.agent.state import AgentChatRequest, AgentChatResponse


class ElaAgent:
    """
    High-level ELA Universal Agent interface uniting NLU, LLM reasoning, ML prediction, and domain tools.
    """
    def __init__(self, node_base_url: str = "http://localhost:5000"):
        self.loop = AgentLoop(node_base_url=node_base_url)

    async def chat(self, request: AgentChatRequest) -> AgentChatResponse:
        return await self.loop.run(request)
