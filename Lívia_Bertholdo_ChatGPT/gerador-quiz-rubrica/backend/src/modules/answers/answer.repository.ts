import { prisma } from "../../config/prisma";

import { CreateAnswerDTO } from "./dto/create-answer.dto";
import { UpdateAnswerDTO } from "./dto/update-answer.dto";

export class AnswerRepository {
  async create(
    data: CreateAnswerDTO
  ) {
    return prisma.answer.create({
      data,
    });
  }

  async findById(id: string) {
    return prisma.answer.findUnique({
      where: {
        id,
      },
    });
  }

  async findByAttemptAndQuestion(
    attemptId: string,
    questionId: string
  ) {
    return prisma.answer.findFirst({
      where: {
        attemptId,
        questionId,
      },
    });
  }

  async findByAttempt(
    attemptId: string
  ) {
    return prisma.answer.findMany({
      where: {
        attemptId,
      },
      include: {
        question: true,
      },
    });
  }

  async update(
    id: string,
    data: UpdateAnswerDTO
  ) {
    return prisma.answer.update({
      where: {
        id,
      },
      data,
    });
  }
}