"use client";

import { useRef, useState } from "react";
import type { AppLanguage } from "@/types/diagnosis";

interface VoiceInputProps {
  language: AppLanguage;
  onTranscript: (text: string) => void;
}

type SpeechRecognitionType = typeof window.SpeechRecognition;

export default function VoiceInput({ language, onTranscript }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const startListening = () => {
    if (typeof window === "undefined") {
      return;
    }

    const SpeechRecognitionAPI =
      (window as Window & {
        SpeechRecognition?: SpeechRecognitionType;
        webkitSpeechRecognition?: SpeechRecognitionType;
      }).SpeechRecognition ||
      (window as Window & { webkitSpeechRecognition?: SpeechRecognitionType })
        .webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = language === "hindi" ? "hi-IN" : "en-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript;
      if (transcript) {
        onTranscript(transcript);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognition.onerror = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    setIsListening(true);
    recognition.start();
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  return (
    <button
      type="button"
      onClick={isListening ? stopListening : startListening}
      className={`rounded-full px-4 py-2 text-sm font-semibold text-white ${
        isListening ? "bg-red-500 hover:bg-red-600" : "bg-green-800 hover:bg-green-900"
      }`}
    >
      {isListening ? "🎙️ सुन रहा हूं..." : "🎤 Voice Input"}
    </button>
  );
}
