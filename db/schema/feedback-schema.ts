import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"

export const feedbackTable = pgTable("feedback", {
  id: uuid("id").defaultRandom().primaryKey(),
  question: text("question").notNull(),
  feedback: text("feedback").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
})

export type InsertFeedback = typeof feedbackTable.$inferInsert
export type SelectFeedback = typeof feedbackTable.$inferSelect 