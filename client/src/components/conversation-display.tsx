import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Bot, User } from "lucide-react";
import type { Message } from "@shared/schema";

interface ConversationDisplayProps {
  messages: Message[];
  isProcessing: boolean;
  onQuickResponse: (response: string) => void;
}

export function ConversationDisplay({ messages, isProcessing, onQuickResponse }: ConversationDisplayProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const quickResponses = [
    "Tell me more",
    "What's the pricing?",
    "Schedule a demo",
    "I'm interested",
    "Not right now",
    "Send me information"
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-neutral-900">Live Conversation</h3>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
          <span className="text-sm text-neutral-600">Active</span>
        </div>
      </div>
      
      {/* Conversation Thread */}
      <div className="space-y-4 max-h-96 overflow-y-auto mb-4">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <div className="text-neutral-400 mb-2">
              <Bot size={48} className="mx-auto" />
            </div>
            <p className="text-neutral-500">Start a conversation to see messages here</p>
          </div>
        )}
        
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex items-start space-x-3 ${message.isUser ? 'justify-end' : ''}`}
          >
            {!message.isUser && (
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                <Bot className="text-white" size={16} />
              </div>
            )}
            
            <div className="flex-1 max-w-xs sm:max-w-sm md:max-w-md">
              <div className={`rounded-lg p-3 ${
                message.isUser 
                  ? 'bg-primary text-white' 
                  : 'bg-neutral-100 text-neutral-900'
              }`}>
                <p className="text-sm">{message.content}</p>
              </div>
              <div className={`text-xs text-neutral-500 mt-1 ${message.isUser ? 'text-right' : ''}`}>
                {message.isUser ? 'You' : 'Alex'} • {new Date(message.timestamp).toLocaleTimeString()}
              </div>
            </div>
            
            {message.isUser && (
              <div className="w-8 h-8 bg-neutral-300 rounded-lg flex items-center justify-center flex-shrink-0">
                <User className="text-neutral-600" size={16} />
              </div>
            )}
          </div>
        ))}
        
        {/* Typing Indicator */}
        {isProcessing && (
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
              <Bot className="text-white" size={16} />
            </div>
            <div className="flex-1">
              <div className="bg-neutral-100 rounded-lg p-3">
                <div className="voice-activity-dots">
                  <div></div>
                  <div></div>
                  <div></div>
                </div>
              </div>
              <div className="text-xs text-neutral-500 mt-1">Alex is typing...</div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Quick Actions */}
      <div className="pt-4 border-t border-gray-200">
        <div className="flex flex-wrap gap-2">
          {quickResponses.map((response) => (
            <Button
              key={response}
              variant="outline"
              size="sm"
              onClick={() => onQuickResponse(response)}
              className="text-xs"
            >
              {response}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
