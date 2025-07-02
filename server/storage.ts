import { 
  conversations, 
  messages, 
  type Conversation, 
  type InsertConversation,
  type Message,
  type InsertMessage,
  type ContactInfo,
  type LeadScore,
  type BookingInfo 
} from "@shared/schema";

export interface IStorage {
  // Conversation methods
  getConversationBySessionId(sessionId: string): Promise<Conversation | undefined>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  updateConversation(id: number, updates: Partial<{
    leadScore: LeadScore;
    contactInfo: ContactInfo;
    bookingInfo: BookingInfo;
    qualificationStatus: string;
  }>): Promise<Conversation>;
  
  // Message methods
  getMessagesByConversationId(conversationId: number): Promise<Message[]>;
  addMessage(message: InsertMessage): Promise<Message>;
}

export class MemStorage implements IStorage {
  private conversations: Map<number, Conversation>;
  private messages: Map<number, Message>;
  private currentConversationId: number;
  private currentMessageId: number;

  constructor() {
    this.conversations = new Map();
    this.messages = new Map();
    this.currentConversationId = 1;
    this.currentMessageId = 1;
  }

  async getConversationBySessionId(sessionId: string): Promise<Conversation | undefined> {
    return Array.from(this.conversations.values()).find(
      (conversation) => conversation.sessionId === sessionId
    );
  }

  async createConversation(insertConversation: InsertConversation): Promise<Conversation> {
    const id = this.currentConversationId++;
    const conversation: Conversation = {
      ...insertConversation,
      id,
      contactInfo: insertConversation.contactInfo || null,
      bookingInfo: insertConversation.bookingInfo || null,
      qualificationStatus: insertConversation.qualificationStatus || "in_progress",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.conversations.set(id, conversation);
    return conversation;
  }

  async updateConversation(
    id: number, 
    updates: Partial<{
      leadScore: LeadScore;
      contactInfo: ContactInfo;
      bookingInfo: BookingInfo;
      qualificationStatus: string;
    }>
  ): Promise<Conversation> {
    const conversation = this.conversations.get(id);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    const updated: Conversation = {
      ...conversation,
      ...updates,
      updatedAt: new Date(),
    };
    
    this.conversations.set(id, updated);
    return updated;
  }

  async getMessagesByConversationId(conversationId: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter((message) => message.conversationId === conversationId)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  async addMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.currentMessageId++;
    const message: Message = {
      ...insertMessage,
      id,
      timestamp: new Date(),
    };
    this.messages.set(id, message);
    return message;
  }
}

export const storage = new MemStorage();
