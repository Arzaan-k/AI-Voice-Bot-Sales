import { useVoice } from "@/hooks/use-voice";
import { Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { LeadScore, ContactInfo } from "@shared/schema";

interface VoiceInterfaceProps {
  sessionId: string;
  isListening: boolean;
  isProcessing: boolean;
  onListeningChange: (listening: boolean) => void;
  onProcessingChange: (processing: boolean) => void;
  onMessageAdd: (content: string, isUser: boolean) => void;
  onLeadScoreUpdate: (score: Partial<LeadScore>) => void;
  onContactInfoUpdate: (info: ContactInfo) => void;
}

export function VoiceInterface({
  sessionId,
  isListening,
  isProcessing,
  onListeningChange,
  onProcessingChange,
  onMessageAdd,
  onLeadScoreUpdate,
  onContactInfoUpdate,
}: VoiceInterfaceProps) {
  const {
    startListening,
    stopListening,
    isMuted,
    toggleMute,
    voiceStatus,
    error,
  } = useVoice({
    sessionId,
    onMessage: onMessageAdd,
    onLeadScoreUpdate,
    onContactInfoUpdate,
    onListeningChange,
    onProcessingChange,
  });

  const handleVoiceToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="text-center">
        <div className="mb-6">
          <div className="relative inline-block">
            <div className={`w-32 h-32 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center relative overflow-hidden voice-indicator ${isListening ? 'listening' : ''}`}>
              {isListening && (
                <div className="absolute inset-0 bg-white opacity-20 rounded-full animate-pulse"></div>
              )}
              <Mic className="text-white text-3xl" size={48} />
            </div>
            
            {/* Voice Activity Indicator */}
            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-accent rounded-full flex items-center justify-center">
              <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
        
        <h2 className="text-2xl font-semibold text-neutral-900 mb-2">Ready to Book Your Sales Call?</h2>
        <p className="text-neutral-600 mb-6">Hi! I'm Alex, your AI sales assistant. Click the button below and let's have a conversation about how we can help your business grow.</p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={handleVoiceToggle}
            disabled={isProcessing}
            className={`px-8 py-3 font-medium transition-colors ${
              isListening 
                ? 'bg-red-500 hover:bg-red-600 text-white' 
                : 'bg-primary hover:bg-secondary text-white'
            }`}
          >
            {isListening ? <MicOff className="mr-2" size={20} /> : <Mic className="mr-2" size={20} />}
            <span>{isListening ? 'Stop Conversation' : 'Start Conversation'}</span>
          </Button>
          
          <Button
            onClick={toggleMute}
            variant="outline"
            className="px-8 py-3 font-medium"
          >
            {isMuted ? <VolumeX className="mr-2" size={20} /> : <Volume2 className="mr-2" size={20} />}
            <span>{isMuted ? 'Unmute' : 'Mute'}</span>
          </Button>
        </div>
        
        {/* Voice Status */}
        <div className="mt-4 text-sm text-neutral-500">
          <span>{error || voiceStatus}</span>
        </div>
      </div>
    </div>
  );
}
