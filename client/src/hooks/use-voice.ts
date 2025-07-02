import { useState, useRef, useCallback, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { LeadScore, ContactInfo } from "@shared/schema";

interface UseVoiceProps {
  sessionId: string;
  onMessage: (content: string, isUser: boolean) => void;
  onLeadScoreUpdate: (score: Partial<LeadScore>) => void;
  onContactInfoUpdate: (info: ContactInfo) => void;
  onListeningChange: (listening: boolean) => void;
  onProcessingChange: (processing: boolean) => void;
}

interface VoiceResponse {
  response: string;
  leadScore?: Partial<LeadScore>;
  contactInfo?: ContactInfo;
}

export function useVoice({
  sessionId,
  onMessage,
  onLeadScoreUpdate,
  onContactInfoUpdate,
  onListeningChange,
  onProcessingChange,
}: UseVoiceProps) {
  const [voiceStatus, setVoiceStatus] = useState("Click 'Start Conversation' to begin");
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthesisRef = useRef<SpeechSynthesisUtterance | null>(null);

  const chatMutation = useMutation({
    mutationFn: async (message: string): Promise<VoiceResponse> => {
      const response = await apiRequest('POST', '/api/chat', {
        message,
        sessionId,
      });
      return response.json();
    },
    onSuccess: (data) => {
      onMessage(data.response, false);
      if (data.leadScore) {
        onLeadScoreUpdate(data.leadScore);
      }
      if (data.contactInfo) {
        onContactInfoUpdate(data.contactInfo);
      }
      if (!isMuted) {
        speak(data.response);
      }
      onProcessingChange(false);
    },
    onError: (error) => {
      setError(`AI Error: ${error.message}`);
      onProcessingChange(false);
    },
  });

  const speak = useCallback((text: string) => {
    if ('speechSynthesis' in window && !isMuted) {
      // Cancel any ongoing speech
      speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 0.8;
      
      // Find a suitable voice
      const voices = speechSynthesis.getVoices();
      const preferredVoice = voices.find(voice => 
        voice.lang.startsWith('en') && voice.name.includes('Female')
      ) || voices.find(voice => voice.lang.startsWith('en'));
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
      
      synthesisRef.current = utterance;
      speechSynthesis.speak(utterance);
    }
  }, [isMuted]);

  const startListening = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError('Speech recognition not supported in this browser');
      return;
    }

    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setVoiceStatus('Listening...');
        setError(null);
        onListeningChange(true);
      };

      recognition.onresult = (event) => {
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          }
        }

        if (finalTranscript.trim()) {
          onMessage(finalTranscript.trim(), true);
          onProcessingChange(true);
          setVoiceStatus('Processing...');
          chatMutation.mutate(finalTranscript.trim());
        }
      };

      recognition.onerror = (event) => {
        setError(`Speech recognition error: ${event.error}`);
        onListeningChange(false);
      };

      recognition.onend = () => {
        setVoiceStatus("Click 'Start Conversation' to begin");
        onListeningChange(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      setError('Failed to start speech recognition');
    }
  }, [onMessage, onListeningChange, onProcessingChange, chatMutation]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    speechSynthesis.cancel();
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      if (!prev) {
        // Muting - cancel any ongoing speech
        speechSynthesis.cancel();
      }
      return !prev;
    });
  }, []);

  // Load voices when they become available
  useEffect(() => {
    if ('speechSynthesis' in window) {
      const loadVoices = () => speechSynthesis.getVoices();
      
      if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = loadVoices;
      }
      
      // Initial load
      loadVoices();
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      speechSynthesis.cancel();
    };
  }, []);

  return {
    startListening,
    stopListening,
    isMuted,
    toggleMute,
    voiceStatus,
    error,
  };
}
