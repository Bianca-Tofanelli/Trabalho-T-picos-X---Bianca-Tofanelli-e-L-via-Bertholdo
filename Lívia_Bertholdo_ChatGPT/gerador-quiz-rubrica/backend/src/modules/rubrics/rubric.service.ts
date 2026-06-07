import { RubricRepository } from "./rubric.repository";

import { AppError } from "../../shared/errors/AppError";

import { CreateRubricDTO } from "./dto/create-rubric.dto";
import { UpdateRubricDTO } from "./dto/update-rubric.dto";

export class RubricService {
  private repository =
    new RubricRepository();

  async create(
    data: CreateRubricDTO
  ) {
    return this.repository.create(
      data
    );
  }

  async findAll() {
    return this.repository.findAll();
  }

  async findById(id: string) {
    const rubric =
      await this.repository.findById(id);

    if (!rubric) {
      throw new AppError(
        "Rubrica não encontrada",
        404
      );
    }

    return rubric;
  }

  async update(
    id: string,
    data: UpdateRubricDTO
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
}