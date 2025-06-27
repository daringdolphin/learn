"use server"

import { db } from "@/db/db"
import { InsertFeedback, SelectFeedback, feedbackTable } from "@/db/schema/feedback-schema"
import { ActionState } from "@/types"
import { eq } from "drizzle-orm"

export async function createFeedbackAction(
  feedback: InsertFeedback
): Promise<ActionState<SelectFeedback>> {
  try {
    const [newFeedback] = await db.insert(feedbackTable).values(feedback).returning()
    return {
      isSuccess: true,
      message: "Feedback created successfully",
      data: newFeedback
    }
  } catch (error) {
    console.error("Error creating feedback:", error)
    return { isSuccess: false, message: "Failed to create feedback" }
  }
}

export async function getFeedbackAction(): Promise<ActionState<SelectFeedback[]>> {
  try {
    const feedback = await db.query.feedback.findMany({
      orderBy: (feedback, { desc }) => [desc(feedback.createdAt)]
    })
    return {
      isSuccess: true,
      message: "Feedback retrieved successfully",
      data: feedback
    }
  } catch (error) {
    console.error("Error getting feedback:", error)
    return { isSuccess: false, message: "Failed to get feedback" }
  }
}

export async function getFeedbackByIdAction(
  id: string
): Promise<ActionState<SelectFeedback>> {
  try {
    const feedback = await db.query.feedback.findFirst({
      where: eq(feedbackTable.id, id)
    })

    if (!feedback) {
      return { isSuccess: false, message: "Feedback not found" }
    }

    return {
      isSuccess: true,
      message: "Feedback retrieved successfully",
      data: feedback
    }
  } catch (error) {
    console.error("Error getting feedback by ID:", error)
    return { isSuccess: false, message: "Failed to get feedback" }
  }
}

export async function updateFeedbackAction(
  id: string,
  data: Partial<InsertFeedback>
): Promise<ActionState<SelectFeedback>> {
  try {
    const [updatedFeedback] = await db
      .update(feedbackTable)
      .set(data)
      .where(eq(feedbackTable.id, id))
      .returning()

    return {
      isSuccess: true,
      message: "Feedback updated successfully",
      data: updatedFeedback
    }
  } catch (error) {
    console.error("Error updating feedback:", error)
    return { isSuccess: false, message: "Failed to update feedback" }
  }
}

export async function deleteFeedbackAction(id: string): Promise<ActionState<void>> {
  try {
    await db.delete(feedbackTable).where(eq(feedbackTable.id, id))
    return {
      isSuccess: true,
      message: "Feedback deleted successfully",
      data: undefined
    }
  } catch (error) {
    console.error("Error deleting feedback:", error)
    return { isSuccess: false, message: "Failed to delete feedback" }
  }
} 