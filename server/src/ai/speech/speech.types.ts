// ELA Multilingual Speech Interfaces (Phase 4 Intelligence Core)
// Provider abstractions for Speech-To-Text (STT) and Text-To-Speech (TTS)

import type { SupportedLanguage } from '../ela.types.js';

export interface TranscriptionResult {
  text: string;
  confidence: number;
  detectedLanguage: SupportedLanguage;
  durationSeconds?: number;
  segments?: Array<{ start: number; end: number; text: string }>;
}

export interface SynthesisOptions {
  voice?: string;
  speed?: number; // 0.5 to 2.0 (default 1.0)
  pitch?: number;
  audioFormat?: 'mp3' | 'wav' | 'ogg' | 'pcm';
}

export interface SynthesisResult {
  audioBuffer: Buffer;
  contentType: string;
  durationMs: number;
  language: SupportedLanguage;
}

export interface ISpeechToTextProvider {
  name: string;
  isAvailable(): boolean;
  transcribe(
    audioBuffer: Buffer | ArrayBuffer,
    preferredLanguage?: SupportedLanguage
  ): Promise<TranscriptionResult>;
}

export interface ITextToSpeechProvider {
  name: string;
  isAvailable(): boolean;
  synthesize(
    text: string,
    language: SupportedLanguage,
    options?: SynthesisOptions
  ): Promise<SynthesisResult>;
}

/**
 * Native Mock / Web Standard Speech-To-Text Provider (Fallback)
 */
export class NativeSTTProvider implements ISpeechToTextProvider {
  public name = 'NativeSTTProvider';

  public isAvailable(): boolean {
    return true;
  }

  public async transcribe(
    audioBuffer: Buffer | ArrayBuffer,
    preferredLanguage: SupportedLanguage = 'en'
  ): Promise<TranscriptionResult> {
    return {
      text: '',
      confidence: 0.95,
      detectedLanguage: preferredLanguage,
      durationSeconds: audioBuffer.byteLength / 32000,
    };
  }
}

/**
 * Native Mock / Web Standard Text-To-Speech Provider (Fallback)
 */
export class NativeTTSProvider implements ITextToSpeechProvider {
  public name = 'NativeTTSProvider';

  public isAvailable(): boolean {
    return true;
  }

  public async synthesize(
    text: string,
    language: SupportedLanguage,
    options?: SynthesisOptions
  ): Promise<SynthesisResult> {
    const dummyBuffer = Buffer.from(text, 'utf-8');
    return {
      audioBuffer: dummyBuffer,
      contentType: options?.audioFormat === 'wav' ? 'audio/wav' : 'audio/mpeg',
      durationMs: text.length * 50,
      language,
    };
  }
}

/**
 * Speech Provider Factory
 */
export class SpeechProviderFactory {
  private static sttInstance: ISpeechToTextProvider | null = null;
  private static ttsInstance: ITextToSpeechProvider | null = null;

  public static getSTTProvider(): ISpeechToTextProvider {
    if (!this.sttInstance) {
      this.sttInstance = new NativeSTTProvider();
    }
    return this.sttInstance;
  }

  public static setSTTProvider(provider: ISpeechToTextProvider): void {
    this.sttInstance = provider;
  }

  public static getTTSProvider(): ITextToSpeechProvider {
    if (!this.ttsInstance) {
      this.ttsInstance = new NativeTTSProvider();
    }
    return this.ttsInstance;
  }

  public static setTTSProvider(provider: ITextToSpeechProvider): void {
    this.ttsInstance = provider;
  }
}
