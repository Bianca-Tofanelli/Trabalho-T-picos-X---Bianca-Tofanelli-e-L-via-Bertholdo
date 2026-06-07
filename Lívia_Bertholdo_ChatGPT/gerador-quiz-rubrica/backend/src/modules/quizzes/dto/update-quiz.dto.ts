export interface UpdateQuizDTO {
  title?: string;
  description?: string;

  timeLimit?: number;

  maxAttempts?: number;
}