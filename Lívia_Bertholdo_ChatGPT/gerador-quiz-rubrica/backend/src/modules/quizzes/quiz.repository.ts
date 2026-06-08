import { prisma } from "../../config/prisma";

import { CreateQuizDTO } from "./dto/create-quiz.dto";
import { UpdateQuizDTO } from "./dto/update-quiz.dto";

export class QuizRepository {
  async create(
    data: CreateQuizDTO,
    professorId: string
  ) {
    return prisma.quiz.create({
      data: {
        ...data,
        professorId,
      },
    });
  }

  async findAll() {
    return prisma.quiz.findMany({
      include: {
        questions: true,
      },
    });
  }

  async findById(id: string) {
    return prisma.quiz.findUnique({
      where: {
        id,
      },
      include: {
        questions: true,
      },
    });
  }

  async update(
    id: string,
    data: UpdateQuizDTO
  ) {
    return prisma.quiz.update({
      where: {
        id,
      },
      data,
    });
  }

  async delete(id: string) {
    return prisma.quiz.delete({
      where: {
        id,
      },
    });
  }

  async publish(id: string) {
    return prisma.quiz.update({
      where: {
        id,
      },
      data: {
        status: "PUBLISHED",
      },
    });
  }

  async close(id: string) {
    return prisma.quiz.update({
      where: {
        id,
      },
      data: {
        status: "CLOSED",
      },
    });
  }

  async releaseAnswerKey(
    id: string
  ) {
    return prisma.quiz.update({
      where: {
        id,
      },
      data: {
        answerKeyReleased: true,
      },
    });
  }
}