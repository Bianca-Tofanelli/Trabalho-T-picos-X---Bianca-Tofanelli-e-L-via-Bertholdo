import { prisma } from "../../config/prisma";

import { AppError } from "../../shared/errors/AppError";

import { AnswerRepository } from "./answer.repository";

import { CreateAnswerDTO } from "./dto/create-answer.dto";
import { UpdateAnswerDTO } from "./dto/update-answer.dto";

export class AnswerService {
  private repository =
    new AnswerRepository();

  async create(
    data: CreateAnswerDTO,
    studentId: string
  ) {
    const attempt =
      await prisma.attempt.findUnique({
        where: {
          id: data.attemptId,
        },
      });

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
        "Prova já finalizada",
        400
      );
    }

    const existingAnswer =
      await this.repository.findByAttemptAndQuestion(
        data.attemptId,
        data.questionId
      );

    if (existingAnswer) {
      throw new AppError(
        "Questão já respondida",
        400
      );
    }

    return this.repository.create(
      data
    );
  }

  async update(
    id: string,
    data: UpdateAnswerDTO,
    studentId: string
  ) {
    const answer =
      await this.repository.findById(id);

    if (!answer) {
      throw new AppError(
        "Resposta não encontrada",
        404
      );
    }

    const attempt =
      await prisma.attempt.findUnique({
        where: {
          id: answer.attemptId,
        },
      });

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
        "Prova já finalizada",
        400
      );
    }

    return this.repository.update(
      id,
      data
    );
  }

  async findByAttempt(
    attemptId: string
  ) {
    return this.repository.findByAttempt(
      attemptId
    );
  }
}