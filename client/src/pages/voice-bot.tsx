import { useState, useEffect } from "react";
import { VoiceInterface } from "@/components/voice-interface";
import { ConversationDisplay } from "@/components/conversation-display";
import { LeadQualification } from "@/components/lead-qualification";
import { ContactForm } from "@/components/contact-form";
import { CallBooking } from "@/components/call-booking";
import { Settings, CheckCircle } from "lucide-react";
import type { Message, LeadScore, ContactInfo, BookingInfo } from "@shared/schema";

export default function VoiceBot() {
  const [sessionId] = useState(() => Date.now().toString());
  const [messages, setMessages] = useState<Message[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [leadScore, setLeadScore] = useState<LeadScore>({
    budget: 0,
    authority: 0,
    need: 0,
    timeline: 0,
    overall: 0,
  });
  const [contactInfo, setContactInfo] = useState<ContactInfo>({});
  const [bookingInfo, setBookingInfo] = useState<BookingInfo>({});

  const addMessage = (content: string, isUser: boolean) => {
    const newMessage: Message = {
      id: Date.now(),
      conversationId: 0, // Will be set by server
      content,
      isUser,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const updateLeadScore = (newScore: Partial<LeadScore>) => {
    setLeadScore(prev => {
      const updated = { ...prev, ...newScore };
      const overall = (updated.budget + updated.authority + updated.need + updated.timeline) / 4;
      return { ...updated, overall };
    });
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <i className="fas fa-robot text-white text-lg"></i>
              </div>
              <div>
                <h1 className="text-xl font-bold text-neutral-900">Alex AI Sales Bot</h1>
                <p className="text-sm text-neutral-500">Your Professional Sales Assistant</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-2">
                <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
                <span className="text-sm text-neutral-600">Online</span>
              </div>
              <button className="p-2 text-neutral-400 hover:text-neutral-600 transition-colors">
                <Settings className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Voice Interface Section */}
          <div className="lg:col-span-2 space-y-6">
            <VoiceInterface
              sessionId={sessionId}
              isListening={isListening}
              isProcessing={isProcessing}
              onListeningChange={setIsListening}
              onProcessingChange={setIsProcessing}
              onMessageAdd={addMessage}
              onLeadScoreUpdate={updateLeadScore}
              onContactInfoUpdate={setContactInfo}
            />
            
            <ConversationDisplay
              messages={messages}
              isProcessing={isProcessing}
              onQuickResponse={(response) => addMessage(response, true)}
            />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <LeadQualification leadScore={leadScore} />
            <ContactForm contactInfo={contactInfo} onUpdate={setContactInfo} />
            <CallBooking 
              bookingInfo={bookingInfo} 
              onUpdate={setBookingInfo}
              contactInfo={contactInfo}
              sessionId={sessionId}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <i className="fas fa-robot text-white text-sm"></i>
                </div>
                <span className="font-semibold text-neutral-900">Alex AI Sales Bot</span>
              </div>
              <p className="text-sm text-neutral-600">Your professional AI sales assistant, powered by advanced AI technology to help you book more qualified sales calls.</p>
            </div>
            
            <div>
              <h4 className="font-semibold text-neutral-900 mb-4">Features</h4>
              <ul className="space-y-2 text-sm text-neutral-600">
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-3 w-3 text-accent" />
                  <span>Real-time voice conversations</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-3 w-3 text-accent" />
                  <span>BANT qualification framework</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-3 w-3 text-accent" />
                  <span>Automatic lead scoring</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-3 w-3 text-accent" />
                  <span>Calendar integration</span>
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-neutral-900 mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-neutral-600">
                <li>
                  <a href="#" className="hover:text-primary transition-colors">Documentation</a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition-colors">API Reference</a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition-colors">Contact Support</a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-200 mt-8 pt-8 text-center">
            <p className="text-sm text-neutral-500">
              © 2024 Alex AI Sales Bot. Powered by Gemini AI & Google Sheets.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
