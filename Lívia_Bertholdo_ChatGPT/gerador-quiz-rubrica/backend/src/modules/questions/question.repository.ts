import { prisma } from "../../config/prisma";

import { CreateQuestionDTO } from "./dto/create-question.dto";
import { UpdateQuestionDTO } from "./dto/update-question.dto";
import { FilterQuestionDTO } from "./dto/filter-question.dto";

export class QuestionRepository {
  async create(data: CreateQuestionDTO) {
    return prisma.question.create({
      data,
    });
  }

  async findAll(
    filters?: FilterQuestionDTO,
    page = 1,
    limit = 10
  ) {
    return prisma.question.findMany({
      where: {
        quizId: filters?.quizId,
        type: filters?.type,
      },
      include: {
        alternatives: true,
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async findById(id: string) {
    return prisma.question.findUnique({
      where: { id },
      include: {
        alternatives: true,
      },
    });
  }

  async update(
    id: string,
    data: UpdateQuestionDTO
  ) {
    return prisma.question.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return prisma.question.delete({
      where: { id },
    });
  }

  async duplicate(id: string) {
    const question =
      await prisma.question.findUnique({
        where: { id },
      });

    if (!question) {
      return null;
    }

    return prisma.question.create({
      data: {
        statement: question.statement,
        points: question.points,
        type: question.type,
        order: question.order,
        quizId: question.quizId,
      },
    });
  }
}