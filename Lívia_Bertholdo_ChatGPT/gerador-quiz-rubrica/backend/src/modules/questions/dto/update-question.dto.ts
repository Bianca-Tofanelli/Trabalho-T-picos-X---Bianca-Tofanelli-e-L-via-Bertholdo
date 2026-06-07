import { QuestionType } from "@prisma/client";

export interface UpdateQuestionDTO {
  statement?: string;
  points?: number;
  type?: QuestionType;
  order?: number;
}