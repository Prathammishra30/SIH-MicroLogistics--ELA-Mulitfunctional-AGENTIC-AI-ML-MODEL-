# Speech Provider Interfaces and Implementations for Multilingual Voice Interaction (Phase 4 Python Core)
from abc import ABC, abstractmethod
from typing import Optional, Dict, Any
import base64
from pydantic import BaseModel


class TranscriptionResult(BaseModel):
    text: str
    detected_language: str
    confidence: float = 1.0
    duration_seconds: float = 0.0
    provider_name: str


class AudioSynthesisResult(BaseModel):
    audio_data_base64: str
    audio_format: str = "mp3"
    duration_seconds: float = 0.0
    provider_name: str


class SpeechToTextProvider(ABC):
    @property
    @abstractmethod
    def provider_name(self) -> str:
        pass

    @abstractmethod
    async def transcribe(
        self, audio_data: bytes, target_language: Optional[str] = None, **kwargs
    ) -> TranscriptionResult:
        """Transcribe speech audio bytes into normalized text."""
        pass


class TextToSpeechProvider(ABC):
    @property
    @abstractmethod
    def provider_name(self) -> str:
        pass

    @abstractmethod
    async def synthesize(
        self, text: str, language: str = "en", voice: Optional[str] = None, **kwargs
    ) -> AudioSynthesisResult:
        """Synthesize text into speech audio bytes (base64)."""
        pass


class NativeMockSTTProvider(SpeechToTextProvider):
    @property
    def provider_name(self) -> str:
        return "NativeMockSTTProvider"

    async def transcribe(
        self, audio_data: bytes, target_language: Optional[str] = None, **kwargs
    ) -> TranscriptionResult:
        decoded_text = "Main farmer hoon mujhe login karna hai"
        if target_language == "mr":
            decoded_text = "मी शेतकरी आहे मला टोमॅटो विकायचे आहेत"
        elif target_language == "ta":
            decoded_text = "எனக்கு 1000 கிலோ தக்காளி வேண்டும்"

        return TranscriptionResult(
            text=decoded_text,
            detected_language=target_language or "hi",
            confidence=0.96,
            duration_seconds=2.4,
            provider_name=self.provider_name,
        )


class NativeMockTTSProvider(TextToSpeechProvider):
    @property
    def provider_name(self) -> str:
        return "NativeMockTTSProvider"

    async def synthesize(
        self, text: str, language: str = "en", voice: Optional[str] = None, **kwargs
    ) -> AudioSynthesisResult:
        dummy_audio = f"// ELA Audio synthesis for [{language}]: {text[:40]}".encode('utf-8')
        b64 = base64.b64encode(dummy_audio).decode('utf-8')
        return AudioSynthesisResult(
            audio_data_base64=b64,
            audio_format="mp3",
            duration_seconds=round(max(1.0, len(text) * 0.05), 1),
            provider_name=self.provider_name,
        )
