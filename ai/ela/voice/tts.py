# Text-to-Speech Provider Abstractions (Phase 4 Python Core)
from abc import ABC, abstractmethod
from typing import Optional
from pydantic import BaseModel


class SynthesisResult(BaseModel):
    audio_base64: str
    audio_format: str = "audio/mp3"
    duration_seconds: float = 0.0


class TextToSpeechProvider(ABC):
    @abstractmethod
    async def synthesize(self, text: str, language: str = "hi", voice_id: Optional[str] = None) -> SynthesisResult:
        pass


class WebSpeechFallbackTTS(TextToSpeechProvider):
    async def synthesize(self, text: str, language: str = "hi", voice_id: Optional[str] = None) -> SynthesisResult:
        return SynthesisResult(
            audio_base64="",
            audio_format="browser_native",
            duration_seconds=len(text) * 0.05,
        )


class ElevenLabsTTS(TextToSpeechProvider):
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key

    async def synthesize(self, text: str, language: str = "hi", voice_id: Optional[str] = None) -> SynthesisResult:
        return SynthesisResult(
            audio_base64="<mock_mp3_stream>",
            audio_format="audio/mp3",
            duration_seconds=3.0,
        )
