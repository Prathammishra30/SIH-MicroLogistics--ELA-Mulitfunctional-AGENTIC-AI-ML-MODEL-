# ELA Agent Core Orchestrator (Phase 4 Python Core)
from typing import Optional, Dict, Any
from ai.ela.agent.loop import ElaAgentLoop, AgentChatRequest, AgentChatResponse


class ElaAgent:
    _loop = ElaAgentLoop()

    @classmethod
    async def process_message(
        cls,
        message: str,
        session_id: Optional[str] = None,
        user_id: Optional[str] = None,
        authenticated: bool = False,
        authenticated_role: str = 'GUEST',
        language: str = 'en',
        context: Optional[Dict[str, Any]] = None,
        auth_token: Optional[str] = None,
    ) -> AgentChatResponse:
        req = AgentChatRequest(
            message=message,
            session_id=session_id,
            user_id=user_id,
            authenticated=authenticated,
            authenticated_role=authenticated_role,  # type: ignore
            language=language,  # type: ignore
            context=context or {},
            auth_token=auth_token,
        )
        return await cls._loop.run(req)
