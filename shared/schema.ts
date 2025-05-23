import { pgTable, text, serial, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const notes = pgTable("notes", {
  id: text("id").primaryKey(), // UUID
  title: text("title").notNull(),
  content: text("content").notNull().default(""),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  synced: boolean("synced").notNull().default(false),
});

export const insertNoteSchema = createInsertSchema(notes).omit({
  synced: true,
});

export const updateNoteSchema = createInsertSchema(notes).omit({
  synced: true,
}).partial().extend({
  id: z.string().uuid(),
});

export type InsertNote = z.infer<typeof insertNoteSchema>;
export type UpdateNote = z.infer<typeof updateNoteSchema>;
export type Note = typeof notes.$inferSelect;

// For client-side operations
export type LocalNote = {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
  synced: boolean;
};
