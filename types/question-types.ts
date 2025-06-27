import { SyllabusReference } from "./syllabus-reference-types"

export interface Question {
  id: string
  promptImg: string
  modelAnswerJson: ModelAnswerPart[]
  marks: number
  syllabusReference: SyllabusReference
  createdAt: string
}

export interface ModelAnswerPart {
  part: string
  subpart?: string
  questionText: string
  marks: number
  answers: AnswerPoint[]
}

export interface AnswerPoint {
  text: string
  keywords: string[]
  notes: string
  marks: number
}

export interface ModelAnswerResponse {
  modelAnswerImgUrls: string[]
  modelAnswerJson: ModelAnswerPart[]
} 