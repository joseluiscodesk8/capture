declare global {
    interface SpeechRecognition extends EventTarget {
      continuous: boolean;
      interimResults: boolean;
      lang: string;
      start(): void;
      stop(): void;
      onresult: ((event: SpeechRecognitionEvent) => void) | null;
      onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
    }
  
    interface SpeechRecognitionErrorEvent extends Event {
      error: string;
    }
  
    interface SpeechRecognitionResult {
      isFinal: boolean;
      0: SpeechRecognitionAlternative;
    }
  
    interface SpeechRecognitionAlternative {
      transcript: string;
    }
  
    interface SpeechRecognitionResultList {
      length: number;
      item(index: number): SpeechRecognitionResult;
      [index: number]: SpeechRecognitionResult;
    }
  
    interface SpeechRecognitionEvent extends Event {
      results: SpeechRecognitionResultList;
    }
  
    interface Window {
      SpeechRecognition: {
        new (): SpeechRecognition;
      };
      webkitSpeechRecognition: {
        new (): SpeechRecognition;
      };
    }
  }
  
  export {};
  