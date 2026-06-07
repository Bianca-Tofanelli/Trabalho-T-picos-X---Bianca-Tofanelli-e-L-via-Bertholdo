export interface CreateQuizDTO {
  title: string;
  description?: string;

  timeLimit?: number;

  maxAttempts?: number;
}