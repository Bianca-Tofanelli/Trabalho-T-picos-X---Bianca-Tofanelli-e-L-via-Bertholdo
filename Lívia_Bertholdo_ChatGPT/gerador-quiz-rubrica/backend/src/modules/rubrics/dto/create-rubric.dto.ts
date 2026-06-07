export interface CreateRubricDTO {
  title: string;

  description?: string;

  criteria: any;

  maxScore: number;

  quizId: string;
}