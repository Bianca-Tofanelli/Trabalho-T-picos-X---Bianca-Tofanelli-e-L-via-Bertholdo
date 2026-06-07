import { QuestionType } from "@prisma/client";

export interface CreateQuestionDTO {
  statement: string;
  points: number;
  type: QuestionType;
  order: number;
  quizId: string;
}