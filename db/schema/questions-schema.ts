import { pgTable, text, timestamp, integer, jsonb } from "drizzle-orm/pg-core"

export const questionsTable = pgTable("questions", {
  id: text("id").primaryKey(),
  promptImg: text("prompt_img").notNull(),
  modelAnswerJson: jsonb("model_answer_json").notNull(),
  marks: integer("marks").notNull(),
  syllabusReference: jsonb("syllabus_reference"),
  createdAt: timestamp("created_at").defaultNow().notNull()
})

export type InsertQuestion = typeof questionsTable.$inferInsert
export type SelectQuestion = typeof questionsTable.$inferSelect 