import { prisma } from "../../config/prisma";

import { CreateAlternativeDTO } from "./dto/create-alternative.dto";
import { UpdateAlternativeDTO } from "./dto/update-alternative.dto";

export class AlternativeRepository {
  async create(
    data: CreateAlternativeDTO
  ) {
    return prisma.alternative.create({
      data,
    });
  }

  async findById(id: string) {
    return prisma.alternative.findUnique({
      where: {
        id,
      },
    });
  }

  async findByQuestion(
    questionId: string
  ) {
    return prisma.alternative.findMany({
      where: {
        questionId,
      },
      orderBy: {
        text: "asc",
      },
    });
  }

  async countCorrectAlternatives(
    questionId: string
  ) {
    return prisma.alternative.count({
      where: {
        questionId,
        isCorrect: true,
      },
    });
  }

  async update(
    id: string,
    data: UpdateAlternativeDTO
  ) {
    return prisma.alternative.update({
      where: {
        id,
      },
      data,
    });
  }

  async delete(id: string) {
    return prisma.alternative.delete({
      where: {
        id,
      },
    });
  }
}