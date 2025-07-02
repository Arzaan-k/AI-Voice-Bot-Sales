import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { storage } from "./storage";
import { geminiService } from "./services/gemini";
import { sheetsService } from "./services/sheets";

const chatRequestSchema = z.object({
  message: z.string(),
  sessionId: z.string(),
});

const bookCallSchema = z.object({
  bookingInfo: z.object({
    date: z.string().optional(),
    time: z.string().optional(),
    type: z.enum(["video", "phone"]).optional(),
  }),
  contactInfo: z.object({
    name: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    company: z.string().optional(),
    title: z.string().optional(),
  }),
  sessionId: z.string(),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Chat endpoint for AI conversations
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, sessionId } = chatRequestSchema.parse(req.body);
      
      // Get or create conversation
      let conversation = await storage.getConversationBySessionId(sessionId);
      if (!conversation) {
        conversation = await storage.createConversation({
          sessionId,
          transcript: [],
          leadScore: { budget: 0, authority: 0, need: 0, timeline: 0, overall: 0 },
          qualificationStatus: "in_progress",
        });
      }

      // Add user message
      await storage.addMessage({
        conversationId: conversation.id,
        content: message,
        isUser: true,
      });

      // Get conversation history
      const messages = await storage.getMessagesByConversationId(conversation.id);
      
      // Generate AI response
      const aiResponse = await geminiService.generateResponse({
        message,
        sessionId,
        conversationHistory: messages.map(m => ({
          content: m.content,
          isUser: m.isUser,
        })),
      });

      // Add AI response message
      await storage.addMessage({
        conversationId: conversation.id,
        content: aiResponse.response,
        isUser: false,
      });

      // Update conversation with new lead score and contact info
      const updatedLeadScore = {
        ...conversation.leadScore as any,
        ...aiResponse.leadScore,
      };

      const updatedContactInfo = {
        ...conversation.contactInfo as any,
        ...aiResponse.contactInfo,
      };

      await storage.updateConversation(conversation.id, {
        leadScore: updatedLeadScore,
        contactInfo: updatedContactInfo,
      });

      // Log to Google Sheets
      await sheetsService.logConversation({
        sessionId,
        userMessage: message,
        aiResponse: aiResponse.response,
        leadScore: updatedLeadScore,
        contactInfo: updatedContactInfo,
        timestamp: new Date(),
      });

      res.json(aiResponse);
    } catch (error) {
      console.error('Chat API error:', error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : 'Internal server error' 
      });
    }
  });

  // Book call endpoint
  app.post("/api/book-call", async (req, res) => {
    try {
      const { bookingInfo, contactInfo, sessionId } = bookCallSchema.parse(req.body);
      
      // Validate required fields
      if (!contactInfo.name || !contactInfo.email || !bookingInfo.date || !bookingInfo.time) {
        return res.status(400).json({ 
          message: 'Missing required fields: name, email, date, and time are required' 
        });
      }

      // Get conversation
      const conversation = await storage.getConversationBySessionId(sessionId);
      if (!conversation) {
        return res.status(404).json({ message: 'Conversation not found' });
      }

      // Update conversation with booking info
      await storage.updateConversation(conversation.id, {
        bookingInfo,
        contactInfo,
        qualificationStatus: "call_booked",
      });

      // Log booking to Google Sheets
      await sheetsService.logCallBooking({
        sessionId,
        contactInfo,
        bookingInfo,
        leadScore: conversation.leadScore as any,
        timestamp: new Date(),
      });

      res.json({ 
        success: true,
        message: 'Call booked successfully! You will receive a calendar invitation shortly.' 
      });
    } catch (error) {
      console.error('Book call API error:', error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : 'Failed to book call' 
      });
    }
  });

  // Get conversation history
  app.get("/api/conversations/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      
      const conversation = await storage.getConversationBySessionId(sessionId);
      if (!conversation) {
        return res.status(404).json({ message: 'Conversation not found' });
      }

      const messages = await storage.getMessagesByConversationId(conversation.id);
      
      res.json({
        conversation,
        messages,
      });
    } catch (error) {
      console.error('Get conversation API error:', error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : 'Failed to get conversation' 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
