import { GoogleGenAI } from "@google/genai";
import type { GeminiRequest, GeminiResponse } from "../../client/src/lib/gemini";
import { SALES_PROMPT } from "../../client/src/lib/gemini";

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "" 
});

class GeminiService {
  async generateResponse(request: GeminiRequest): Promise<GeminiResponse> {
    try {
      // Build conversation context
      const conversationContext = request.conversationHistory
        ?.map(msg => `${msg.isUser ? 'User' : 'Alex'}: ${msg.content}`)
        .join('\n') || '';

      const prompt = `${SALES_PROMPT}

Current conversation:
${conversationContext}
User: ${request.message}

Respond as Alex and provide:
1. A natural, conversational response
2. Lead qualification scores (0-10 for Budget, Authority, Need, Timeline)
3. Any contact information gathered from the conversation

Respond in JSON format:
{
  "response": "your conversational response",
  "leadScore": {
    "budget": 0-10,
    "authority": 0-10,
    "need": 0-10,
    "timeline": 0-10
  },
  "contactInfo": {
    "name": "if mentioned",
    "email": "if mentioned",
    "phone": "if mentioned",
    "company": "if mentioned",
    "title": "if mentioned"
  }
}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              response: { type: "string" },
              leadScore: {
                type: "object",
                properties: {
                  budget: { type: "number" },
                  authority: { type: "number" },
                  need: { type: "number" },
                  timeline: { type: "number" },
                },
              },
              contactInfo: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  email: { type: "string" },
                  phone: { type: "string" },
                  company: { type: "string" },
                  title: { type: "string" },
                },
              },
            },
            required: ["response"],
          },
        },
        contents: prompt,
      });

      const rawJson = response.text;
      if (!rawJson) {
        throw new Error("Empty response from Gemini");
      }

      const data: GeminiResponse = JSON.parse(rawJson);
      
      // Ensure response exists
      if (!data.response) {
        data.response = "I'm here to help you explore how our solutions can benefit your business. Could you tell me more about your current challenges?";
      }

      return data;
    } catch (error) {
      console.error('Gemini API error:', error);
      
      // Fallback response
      return {
        response: "I apologize, but I'm experiencing some technical difficulties. Let me try to help you another way - could you tell me about your business needs?",
        leadScore: {
          budget: 0,
          authority: 0,
          need: 0,
          timeline: 0,
        },
      };
    }
  }
}

export const geminiService = new GeminiService();
