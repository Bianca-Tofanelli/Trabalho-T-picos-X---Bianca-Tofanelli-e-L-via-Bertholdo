import { prisma } from "../../config/prisma";

import { CreateRubricDTO } from "./dto/create-rubric.dto";
import { UpdateRubricDTO } from "./dto/update-rubric.dto";

export class RubricRepository {
  async create(
    data: CreateRubricDTO
  ) {
    return prisma.rubric.create({
      data,
    });
  }

  async findAll() {
    return prisma.rubric.findMany({
      include: {
        quiz: true,
      },
    });
  }

  async findById(id: string) {
    return prisma.rubric.findUnique({
      where: {
        id,
      },
      include: {
        quiz: true,
      },
    });
  }

  async update(
    id: string,
    data: UpdateRubricDTO
  ) {
    return prisma.rubric.update({
      where: {
        id,
      },
      data,
    });
  }

  async delete(id: string) {
    return prisma.rubric.delete({
      where: {
        id,
      },
    });
  }
}