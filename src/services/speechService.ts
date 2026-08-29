// ELA Web Speech Recognition (STT) and Synthesis (TTS) Service
// Supports 7 Indian Languages with Graceful Browser Fallback

export type SupportedSpeechLang = 'en' | 'hi' | 'mr' | 'ta' | 'te' | 'bn' | 'kn';

const langLocaleMap: Record<SupportedSpeechLang, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  mr: 'mr-IN',
  ta: 'ta-IN',
  te: 'te-IN',
  bn: 'bn-IN',
  kn: 'kn-IN',
};

interface SpeechResultItem {
  transcript: string;
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
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }
}

export class SpeechService {
  private static recognition: SpeechRecognitionInstance | null = null;

  public static isSTTSupported(): boolean {
    return typeof window !== 'undefined' && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  public static isTTSSupported(): boolean {
    return typeof window !== 'undefined' && Boolean('speechSynthesis' in window);
  }

  /**
   * Starts listening to user microphone input in the selected language
   */
  public static startListening(
    lang: SupportedSpeechLang = 'en',
    onResult: (transcript: string, isFinal: boolean) => void,
    onError?: (err: string) => void,
    onEnd?: () => void
  ): boolean {
    if (!this.isSTTSupported()) {
      onError?.('Speech recognition is not supported in this browser.');
      return false;
    }

    try {
      if (this.recognition) {
        this.recognition.abort();
      }

      const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognitionClass) return false;

      this.recognition = new SpeechRecognitionClass();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.lang = langLocaleMap[lang] || 'en-IN';

      this.recognition.onresult = (event: SpeechEvent) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }

        const text = final || interim;
        if (text) {
          onResult(text, Boolean(final));
        }
      };

      this.recognition.onerror = (event: SpeechErrorEvent) => {
        onError?.(event.error || 'Speech recognition error');
      };

      this.recognition.onend = () => {
        onEnd?.();
      };

      this.recognition.start();
      return true;
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Could not start voice recognition');
      return false;
    }
  }

  public static stopListening(): void {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        // Safe ignore
      }
    }
  }

  /**
   * Speaks response text via Text-to-Speech synthesis in user language
   */
  public static speakText(text: string, lang: SupportedSpeechLang = 'en'): void {
    if (!this.isTTSSupported() || !text) return;

    try {
      window.speechSynthesis.cancel(); // Cancel ongoing speech

      // Clean markdown tags from speech text
      const cleanText = text.replace(/[*_#`[\]()]/g, '').slice(0, 300);
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = langLocaleMap[lang] || 'en-IN';
      utterance.rate = 0.95;
      utterance.pitch = 1.0;

      window.speechSynthesis.speak(utterance);
    } catch {
      // Audio synthesis optional
    }
  }

  public static stopSpeaking(): void {
    if (this.isTTSSupported()) {
      window.speechSynthesis.cancel();
    }
  }
}
