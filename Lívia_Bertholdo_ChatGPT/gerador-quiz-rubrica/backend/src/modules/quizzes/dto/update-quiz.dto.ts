export interface UpdateQuizDTO {
  title?: string;

  description?: string;

  availableFrom?: Date;

  availableUntil?: Date;

  timeLimit?: number;

  maxAttempts?: number;
}