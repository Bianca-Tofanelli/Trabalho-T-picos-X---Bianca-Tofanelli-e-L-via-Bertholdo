import { QuizRepository } from "./quiz.repository";

import { AppError } from "../../shared/errors/AppError";

import { CreateQuizDTO } from "./dto/create-quiz.dto";
import { UpdateQuizDTO } from "./dto/update-quiz.dto";

export class QuizService {
  private repository =
    new QuizRepository();

  async create(
    data: CreateQuizDTO,
    professorId: string
  ) {
    return this.repository.create(
      data,
      professorId
    );
  }

  async findAll() {
    return this.repository.findAll();
  }

  async findById(id: string) {
    const quiz =
      await this.repository.findById(id);

    if (!quiz) {
      throw new AppError(
        "Quiz não encontrado",
        404
      );
    }

    return quiz;
  }

  async update(
    id: string,
    data: UpdateQuizDTO
  ) {
    await this.findById(id);

    return this.repository.update(
      id,
      data
    );
  }

  async delete(id: string) {
    await this.findById(id);

    await this.repository.delete(id);
  }

  async publish(id: string) {
    const quiz =
      await this.findById(id);

    if (quiz.status !== "DRAFT") {
      throw new AppError(
        "Somente quizzes em rascunho podem ser publicados",
        400
      );
    }

    if (quiz.questions.length === 0) {
      throw new AppError(
        "O quiz deve possuir ao menos uma questão",
        400
      );
    }

    return this.repository.publish(id);
  }

  async close(id: string) {
    const quiz =
      await this.findById(id);

    if (quiz.status !== "PUBLISHED") {
      throw new AppError(
        "Somente quizzes publicados podem ser encerrados",
        400
      );
    }

    return this.repository.close(id);
  }
}