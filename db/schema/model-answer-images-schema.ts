import { pgTable, text, integer, bigserial, index } from "drizzle-orm/pg-core"
import { questionsTable } from "./questions-schema"

export const modelAnswerImagesTable = pgTable("model_answer_images", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  questionId: text("question_id")
    .references(() => questionsTable.id, { onDelete: "cascade" })
    .notNull(),
  imgKey: text("img_key").notNull(),
  position: integer("position").notNull()
}, (table) => ({
  questionIdIdx: index("idx_model_answer_images_question").on(table.questionId)
}))

export type InsertModelAnswerImage = typeof modelAnswerImagesTable.$inferInsert
export type SelectModelAnswerImage = typeof modelAnswerImagesTable.$inferSelect 