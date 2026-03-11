import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const LEVEL_NAMES = [
  "Cogito",
  "Subject",
  "Wisdom",
  "Knowledge",
  "Information",
  "Data",
  "Reference",
  "Raw",
] as const;

export const LEVEL_LABELS_KO = [
  "나 (Cogito)",
  "대주제",
  "지혜",
  "지식",
  "정보",
  "데이터",
  "참조",
  "원문",
] as const;

export const LEVEL_COLORS = [
  "#8B5CF6",
  "#7C3AED",
  "#6D28D9",
  "#5B21B6",
  "#4C1D95",
  "#6366F1",
  "#4F46E5",
  "#4338CA",
] as const;

export const LEVEL_ICONS = [
  "Brain",
  "Globe",
  "Sparkles",
  "BookOpen",
  "Lightbulb",
  "Database",
  "Link",
  "FileText",
] as const;

export const knowledgeNodes = pgTable("knowledge_nodes", {
  id: serial("id").primaryKey(),
  parentId: integer("parent_id"),
  level: integer("level").notNull().default(0),
  title: text("title").notNull(),
  description: text("description"),
  content: text("content"),
  color: text("color"),
  icon: text("icon"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const connections = pgTable("connections", {
  id: serial("id").primaryKey(),
  sourceId: integer("source_id").notNull(),
  targetId: integer("target_id").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertNodeSchema = createInsertSchema(knowledgeNodes).omit({
  id: true,
  createdAt: true,
});

export const insertConnectionSchema = createInsertSchema(connections).omit({
  id: true,
  createdAt: true,
});

export type InsertNode = z.infer<typeof insertNodeSchema>;
export type KnowledgeNode = typeof knowledgeNodes.$inferSelect;
export type InsertConnection = z.infer<typeof insertConnectionSchema>;
export type Connection = typeof connections.$inferSelect;

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
