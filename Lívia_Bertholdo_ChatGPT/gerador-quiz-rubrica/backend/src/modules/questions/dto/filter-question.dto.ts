import { QuestionType } from "@prisma/client";

export interface FilterQuestionDTO {
  quizId?: string;
  type?: QuestionType;
}