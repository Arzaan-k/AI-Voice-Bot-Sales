import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  transcript: jsonb("transcript").notNull(),
  leadScore: jsonb("lead_score").notNull(),
  contactInfo: jsonb("contact_info"),
  bookingInfo: jsonb("booking_info"),
  qualificationStatus: text("qualification_status").notNull().default("in_progress"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").references(() => conversations.id).notNull(),
  content: text("content").notNull(),
  isUser: boolean("is_user").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  timestamp: true,
});

export const contactInfoSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  title: z.string().optional(),
});

export const leadScoreSchema = z.object({
  budget: z.number().min(0).max(10),
  authority: z.number().min(0).max(10),
  need: z.number().min(0).max(10),
  timeline: z.number().min(0).max(10),
  overall: z.number().min(0).max(10),
});

export const bookingInfoSchema = z.object({
  date: z.string().optional(),
  time: z.string().optional(),
  type: z.enum(["video", "phone"]).optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
export type ContactInfo = z.infer<typeof contactInfoSchema>;
export type LeadScore = z.infer<typeof leadScoreSchema>;
export type BookingInfo = z.infer<typeof bookingInfoSchema>;
