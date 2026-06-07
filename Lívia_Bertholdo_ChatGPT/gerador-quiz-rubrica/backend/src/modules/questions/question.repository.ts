import { prisma } from "../../config/prisma";

import { CreateQuestionDTO } from "./dto/create-question.dto";
import { UpdateQuestionDTO } from "./dto/update-question.dto";

export class QuestionRepository {
  async create(data: CreateQuestionDTO) {
    return prisma.question.create({
      data,
    });
  }

  async findAll() {
    return prisma.question.findMany();
  }

  async findById(id: string) {
    return prisma.question.findUnique({
      where: {
        id,
      },
    });
  }

  async update(
    id: string,
    data: UpdateQuestionDTO
  ) {
    return prisma.question.update({
      where: {
        id,
      },
      data,
    });
  }

  async delete(id: string) {
    return prisma.question.delete({
      where: {
        id,
      },
    });
  }
}