import { AttemptRepository } from "./attempt.repository";

import { prisma } from "../../config/prisma";

import { AppError } from "../../shared/errors/AppError";

export class AttemptService {
  private repository =
    new AttemptRepository();

  async start(
    quizId: string,
    studentId: string
  ) {
    const quiz =
      await prisma.quiz.findUnique({
        where: {
          id: quizId,
        },
      });

    if (!quiz) {
      throw new AppError(
        "Quiz não encontrado",
        404
      );
    }

    if (quiz.status !== "PUBLISHED") {
      throw new AppError(
        "Quiz não disponível",
        400
      );
    }

    const existingAttempt =
      await this.repository.findStudentAttempt(
        quizId,
        studentId
      );

    if (existingAttempt) {
      throw new AppError(
        "Você já realizou este quiz",
        400
      );
    }

    return this.repository.create(
      quizId,
      studentId
    );
  }

  async finish(
    attemptId: string,
    studentId: string
  ) {
    const attempt =
      await this.repository.findById(
        attemptId
      );

    if (!attempt) {
      throw new AppError(
        "Tentativa não encontrada",
        404
      );
    }

    if (
      attempt.studentId !== studentId
    ) {
      throw new AppError(
        "Acesso negado",
        403
      );
    }

    if (
      attempt.status === "FINISHED"
    ) {
      throw new AppError(
        "Tentativa já finalizada",
        400
      );
    }

    return this.repository.finish(
      attemptId
    );
  }

  async findById(id: string) {
    const attempt =
      await this.repository.findById(
        id
      );

    if (!attempt) {
      throw new AppError(
        "Tentativa não encontrada",
        404
      );
    }

    return attempt;
  }
}