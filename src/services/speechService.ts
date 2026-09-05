// ELA Web Speech Recognition (STT) and Synthesis (TTS) Service
// Authoritative Microphone State Machine, Real Hardware Acquisition, and Explicit Female Voice Selection

export type SupportedSpeechLang = 'en' | 'hi' | 'mr' | 'ta' | 'te' | 'bn' | 'kn';

export type MicrophoneState =
  | 'MIC_IDLE'
  | 'MIC_REQUESTING_PERMISSION'
  | 'MIC_LISTENING'
  | 'MIC_SPEECH_DETECTED'
  | 'MIC_TRANSCRIBING'
  | 'MIC_STOPPING'
  | 'MIC_MUTED'
  | 'MIC_PERMISSION_DENIED'
  | 'MIC_UNAVAILABLE'
  | 'MIC_ERROR';

export interface ActiveVoiceInfo {
  provider: string;
  voiceName: string;
  lang: string;
  gender: 'female';
  isNeural: boolean;
  neuralProvenance: 'NOT VERIFIED (Browser Web Speech synthesis)' | 'VERIFIED';
  voiceProvenance: 'KNOWN (Browser OS Voice Registry)';
}

const langLocaleMap: Record<SupportedSpeechLang, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  mr: 'mr-IN',
  ta: 'ta-IN',
  te: 'te-IN',
  bn: 'bn-IN',
  kn: 'kn-IN',
};

// Explicit female voice priority lists per language
const FEMALE_VOICE_NAMES_BY_LANG: Record<SupportedSpeechLang, string[]> = {
  en: [
    'Microsoft Neerja Online (Natural) - English (India)',
    'Microsoft Neerja',
    'Microsoft Heera - English (India)',
    'Microsoft Heera',
    'Microsoft Jenny Online (Natural) - English (United States)',
    'Microsoft Aria Online (Natural) - English (United States)',
    'Microsoft Zira - English (United States)',
    'Microsoft Zira',
    'Google UK English Female',
    'Google US English',
    'Samantha',
    'Victoria',
    'Karen',
    'Moira',
    'Fiona',
    'Tessa',
  ],
  hi: [
    'Microsoft Swara Online (Natural) - Hindi (India)',
    'Microsoft Swara',
    'Microsoft Kalpana - Hindi (India)',
    'Microsoft Kalpana',
    'Google हिन्दी',
    'Swara',
    'Kalpana',
    'Lekha',
  ],
  mr: [
    'Microsoft Aarohi Online (Natural) - Marathi (India)',
    'Microsoft Aarohi',
    'Aarohi',
  ],
  ta: [
    'Microsoft Pallavi Online (Natural) - Tamil (India)',
    'Microsoft Pallavi',
    'Pallavi',
  ],
  te: [
    'Microsoft Shruti Online (Natural) - Telugu (India)',
    'Microsoft Shruti',
    'Shruti',
  ],
  bn: [
    'Microsoft Tanishaa Online (Natural) - Bengali (India)',
    'Microsoft Tanishaa',
    'Tanishaa',
  ],
  kn: [
    'Microsoft Sapna Online (Natural) - Kannada (India)',
    'Microsoft Sapna',
    'Sapna',
  ],
};

// Known male voice patterns to strictly reject or penalize
const MALE_VOICE_BLACKLIST = [
  'david',
  'mark',
  'george',
  'guy',
  'stefan',
  'ravi',
  'hemant',
  'madhur',
  'manohar',
  'valluvar',
  'mohan',
  'bashkar',
  'gagan',
  'pradeep',
  'kiran',
  'male',
  'boy',
  'man',
  'james',
  'richard',
  'andrew',
  'charles',
  'brian',
  'paul',
  'tom',
  'fred',
];

interface SpeechResultItem {
  transcript: string;
  confidence?: number;
}

interface SpeechResultList {
  length: number;
  isFinal: boolean;
  [index: number]: SpeechResultItem;
}

interface SpeechEvent {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: SpeechResultList;
  };
}

interface SpeechErrorEvent {
  error?: string;
  message?: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechEvent) => void) | null;
  onerror: ((event: SpeechErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
  onspeechstart: (() => void) | null;
  onspeechend: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitAudioContext?: typeof AudioContext;
  }
}

// Cached female voice per language
const femaleVoiceCache = new Map<SupportedSpeechLang, SpeechSynthesisVoice | null>();
let voicesLoaded = false;

/**
 * Checks if a voice is known to be male.
 */
function isMaleVoice(voice: SpeechSynthesisVoice): boolean {
  const name = voice.name.toLowerCase();
  return MALE_VOICE_BLACKLIST.some((m) => name.includes(m));
}

/**
 * Scores a voice for female suitability & naturalness. Higher = better.
 * Male voices receive negative score.
 */
function scoreFemaleVoice(voice: SpeechSynthesisVoice, lang: SupportedSpeechLang): number {
  const name = voice.name.toLowerCase();

  // Strictly reject male voices
  if (isMaleVoice(voice)) {
    return -2000;
  }

  let score = 0;
  const targetLocale = langLocaleMap[lang] || 'en-IN';
  const targetPrefix = targetLocale.split('-')[0];

  // Preferred explicit female list for this language
  const explicitList = FEMALE_VOICE_NAMES_BY_LANG[lang] || [];
  const matchedIdx = explicitList.findIndex((n) => name.includes(n.toLowerCase()));
  if (matchedIdx !== -1) {
    score += 1000 - matchedIdx * 50; // Higher preference for earlier entries
  }

  // Female/woman keyword in voice name
  if (/(female|woman|girl)/i.test(voice.name)) {
    score += 500;
  }

  // Neural / Natural / Online indicators
  if (/neural|natural|online|wavenet|studio/i.test(voice.name)) {
    score += 200;
  }

  // Microsoft / Google brand quality
  if (/microsoft/i.test(voice.name)) score += 100;
  if (/google/i.test(voice.name)) score += 80;

  // Language match
  if (voice.lang === targetLocale) {
    score += 300;
  } else if (voice.lang.startsWith(targetPrefix + '-') || voice.lang.toLowerCase() === targetPrefix) {
    score += 200;
  }

  return score;
}

/**
 * Select the best female voice for a given language.
 * Falls back to an English female voice if the specific language has no female voice.
 */
export function selectBestFemaleVoice(lang: SupportedSpeechLang = 'en'): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;

  if (femaleVoiceCache.has(lang)) {
    const cached = femaleVoiceCache.get(lang);
    if (cached) return cached;
  }

  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;

  // Filter out all male voices
  const eligibleVoices = voices.filter((v) => !isMaleVoice(v));
  if (!eligibleVoices.length) {
    const fallback = voices[0] || null;
    femaleVoiceCache.set(lang, fallback);
    return fallback;
  }

  // Sort eligible voices by female score for this language
  eligibleVoices.sort((a, b) => scoreFemaleVoice(b, lang) - scoreFemaleVoice(a, lang));
  const best = eligibleVoices[0];

  femaleVoiceCache.set(lang, best);
  return best;
}

/**
 * Returns diagnostic metadata about the active female voice for a language.
 * Truthful reporting: identifies Web Speech API browser synthesis.
 */
export function getActiveVoiceInfo(lang: SupportedSpeechLang = 'en'): ActiveVoiceInfo {
  const voice = selectBestFemaleVoice(lang);
  const locale = langLocaleMap[lang] || 'en-IN';

  if (!voice) {
    return {
      provider: 'Web Speech API (Browser Fallback)',
      voiceName: 'System Default Female Voice',
      lang: locale,
      gender: 'female',
      isNeural: false,
      neuralProvenance: 'NOT VERIFIED (Browser Web Speech synthesis)',
      voiceProvenance: 'KNOWN (Browser OS Voice Registry)',
    };
  }

  return {
    provider: 'Web Speech API (Browser SpeechSynthesis)',
    voiceName: voice.name,
    lang: voice.lang || locale,
    gender: 'female',
    isNeural: false,
    neuralProvenance: 'NOT VERIFIED (Browser Web Speech synthesis)',
    voiceProvenance: 'KNOWN (Browser OS Voice Registry)',
  };
}

/**
 * Ensure voices are loaded asynchronously in Chrome/Edge.
 */
function ensureVoicesLoaded(): Promise<void> {
  if (voicesLoaded) return Promise.resolve();
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return Promise.resolve();

  return new Promise<void>((resolve) => {
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      voicesLoaded = true;
      resolve();
      return;
    }
    window.speechSynthesis.onvoiceschanged = () => {
      voicesLoaded = true;
      femaleVoiceCache.clear();
      resolve();
    };
    setTimeout(() => {
      voicesLoaded = true;
      resolve();
    }, 1000);
  });
}

export class SpeechService {
  private static recognition: SpeechRecognitionInstance | null = null;
  private static mediaStream: MediaStream | null = null;
  private static audioContext: AudioContext | null = null;
  private static analyser: AnalyserNode | null = null;
  private static animationFrameId: number | null = null;
  private static currentState: MicrophoneState = 'MIC_IDLE';

  public static isSTTSupported(): boolean {
    return typeof window !== 'undefined' && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  public static isTTSSupported(): boolean {
    return typeof window !== 'undefined' && Boolean('speechSynthesis' in window);
  }

  public static getMicrophoneState(): MicrophoneState {
    return this.currentState;
  }

  /**
   * Request real microphone hardware stream and verify active audio tracks.
   */
  public static async acquireMicrophoneStream(): Promise<MediaStream> {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      throw new Error('MICROPHONE_UNAVAILABLE');
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    const audioTracks = stream.getAudioTracks();
    if (!audioTracks.length || audioTracks[0].readyState !== 'live' || !audioTracks[0].enabled) {
      stream.getTracks().forEach((t) => t.stop());
      throw new Error('MICROPHONE_NOT_ACTIVE');
    }

    return stream;
  }

  /**
   * Start listening with the full hardware mic acquisition, Web Audio analyser, and SpeechRecognition pipeline.
   */
  public static async startListening(params: {
    lang?: SupportedSpeechLang;
    onStateChange: (state: MicrophoneState, errorMsg?: string) => void;
    onPartialTranscript?: (partial: string) => void;
    onFinalTranscript: (final: string, confidence?: number) => void;
    onAudioVolume?: (volume: number) => void;
  }): Promise<boolean> {
    const { lang = 'en', onStateChange, onPartialTranscript, onFinalTranscript, onAudioVolume } = params;

    if (!this.isSTTSupported()) {
      this.currentState = 'MIC_UNAVAILABLE';
      onStateChange('MIC_UNAVAILABLE', 'Speech recognition is not supported in this browser.');
      return false;
    }

    // Stop any existing session
    this.stopListening();

    try {
      this.currentState = 'MIC_REQUESTING_PERMISSION';
      onStateChange('MIC_REQUESTING_PERMISSION');

      // 1. Hardware acquisition
      this.mediaStream = await this.acquireMicrophoneStream();

      // 2. Web Audio Analyser setup for real audio level detection
      try {
        const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
        if (AudioCtxClass) {
          this.audioContext = new AudioCtxClass();
          this.analyser = this.audioContext.createAnalyser();
          this.analyser.fftSize = 256;
          this.analyser.smoothingTimeConstant = 0.4;
          const source = this.audioContext.createMediaStreamSource(this.mediaStream);
          source.connect(this.analyser);

          // Start volume analysis loop
          const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
          const checkVolume = () => {
            if (!this.analyser) return;
            this.analyser.getByteFrequencyData(dataArray);

            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const avg = sum / dataArray.length;
            const normalized = Math.min(1.0, avg / 80); // 0.0 to 1.0

            onAudioVolume?.(normalized);

            if (normalized > 0.08 && this.currentState === 'MIC_LISTENING') {
              this.currentState = 'MIC_SPEECH_DETECTED';
              onStateChange('MIC_SPEECH_DETECTED');
            }

            this.animationFrameId = requestAnimationFrame(checkVolume);
          };
          this.animationFrameId = requestAnimationFrame(checkVolume);
        }
      } catch {
        // Web Audio analyser is optional, proceed with STT
      }

      // 3. Initialize SpeechRecognition
      const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognitionClass) {
        throw new Error('STT_CLASS_NOT_FOUND');
      }

      this.recognition = new SpeechRecognitionClass();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = langLocaleMap[lang] || 'en-IN';

      this.recognition.onstart = () => {
        this.currentState = 'MIC_LISTENING';
        onStateChange('MIC_LISTENING');
      };

      this.recognition.onspeechstart = () => {
        this.currentState = 'MIC_SPEECH_DETECTED';
        onStateChange('MIC_SPEECH_DETECTED');
      };

      this.recognition.onspeechend = () => {
        if (this.currentState === 'MIC_SPEECH_DETECTED') {
          this.currentState = 'MIC_LISTENING';
          onStateChange('MIC_LISTENING');
        }
      };

      this.recognition.onresult = (event: SpeechEvent) => {
        let interim = '';
        let final = '';
        let confidence = 1.0;

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) {
            final += item[0].transcript;
            if (typeof item[0].confidence === 'number' && item[0].confidence > 0) {
              confidence = item[0].confidence;
            }
          } else {
            interim += item[0].transcript;
          }
        }

        if (interim) {
          this.currentState = 'MIC_TRANSCRIBING';
          onStateChange('MIC_TRANSCRIBING');
          onPartialTranscript?.(interim);
        }

        if (final) {
          this.currentState = 'MIC_LISTENING';
          onStateChange('MIC_LISTENING');
          onFinalTranscript(final.trim(), confidence);
        }
      };

      this.recognition.onerror = (event: SpeechErrorEvent) => {
        const errName = event.error || 'speech_error';
        if (errName === 'not-allowed' || errName === 'service-not-allowed') {
          this.currentState = 'MIC_PERMISSION_DENIED';
          onStateChange('MIC_PERMISSION_DENIED', 'Microphone permission denied.');
          this.stopListening();
        } else if (errName === 'no-speech') {
          if (this.currentState !== 'MIC_IDLE') {
            this.currentState = 'MIC_LISTENING';
            onStateChange('MIC_LISTENING');
          }
        } else {
          this.currentState = 'MIC_ERROR';
          onStateChange('MIC_ERROR', event.message || `STT Error: ${errName}`);
        }
      };

      this.recognition.onend = () => {
        if (this.currentState !== 'MIC_IDLE' && this.currentState !== 'MIC_MUTED' && this.currentState !== 'MIC_PERMISSION_DENIED') {
          this.currentState = 'MIC_IDLE';
          onStateChange('MIC_IDLE');
        }
      };

      this.recognition.start();
      return true;
    } catch (err: unknown) {
      const errorObj = err as { name?: string; message?: string };
      if (errorObj?.name === 'NotAllowedError' || errorObj?.name === 'PermissionDeniedError') {
        this.currentState = 'MIC_PERMISSION_DENIED';
        onStateChange('MIC_PERMISSION_DENIED', 'Microphone permission was denied by user or browser.');
      } else if (errorObj?.name === 'NotFoundError' || errorObj?.name === 'DevicesNotFoundError' || errorObj?.message === 'MICROPHONE_UNAVAILABLE') {
        this.currentState = 'MIC_UNAVAILABLE';
        onStateChange('MIC_UNAVAILABLE', 'No microphone hardware found on this device.');
      } else {
        this.currentState = 'MIC_ERROR';
        onStateChange('MIC_ERROR', errorObj?.message || 'Could not start voice recognition.');
      }
      this.stopListening();
      return false;
    }
  }

  /**
   * Stop listening and completely release microphone hardware and AudioContext.
   */
  public static stopListening(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.recognition) {
      try {
        this.recognition.stop();
        this.recognition.abort();
      } catch {
        // Safe ignore
      }
      this.recognition = null;
    }

    if (this.mediaStream) {
      try {
        this.mediaStream.getTracks().forEach((track) => {
          track.stop();
        });
      } catch {
        // Safe ignore
      }
      this.mediaStream = null;
    }

    if (this.audioContext) {
      try {
        if (this.audioContext.state !== 'closed') {
          this.audioContext.close();
        }
      } catch {
        // Safe ignore
      }
      this.audioContext = null;
      this.analyser = null;
    }

    this.currentState = 'MIC_IDLE';
  }

  /**
   * Speaks response text via female Text-to-Speech synthesis in user language.
   */
  public static async speakText(
    text: string,
    lang: SupportedSpeechLang = 'en',
    onStart?: () => void,
    onEnd?: () => void
  ): Promise<void> {
    if (!this.isTTSSupported() || !text) {
      onEnd?.();
      return;
    }

    try {
      window.speechSynthesis.cancel();

      await ensureVoicesLoaded();

      // Clean markdown formatting & multiple spaces from spoken text
      const cleanText = text
        .replace(/[*_#`[\]()>]/g, '')
        .replace(/\n+/g, '. ')
        .slice(0, 500);

      const utterance = new SpeechSynthesisUtterance(cleanText);

      const locale = langLocaleMap[lang] || 'en-IN';
      utterance.lang = locale;
      // Slightly elevated pitch (1.05) to ensure consistent bright natural female cadence
      utterance.pitch = 1.05;
      utterance.rate = 0.95;

      // Select explicit female voice
      const femaleVoice = selectBestFemaleVoice(lang);
      if (femaleVoice) {
        utterance.voice = femaleVoice;
        utterance.lang = femaleVoice.lang || locale;
      }

      utterance.onstart = () => {
        onStart?.();
      };

      utterance.onend = () => {
        onEnd?.();
      };

      utterance.onerror = () => {
        onEnd?.();
      };

      window.speechSynthesis.speak(utterance);
    } catch {
      onEnd?.();
    }
  }

  public static stopSpeaking(): void {
    if (this.isTTSSupported()) {
      window.speechSynthesis.cancel();
    }
  }
}
