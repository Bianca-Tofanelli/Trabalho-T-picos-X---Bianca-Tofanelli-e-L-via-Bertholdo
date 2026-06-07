export interface CreateAnswerDTO {
  attemptId: string;
  questionId: string;

  textAnswer?: string;

  selectedAlternative?: string;
}