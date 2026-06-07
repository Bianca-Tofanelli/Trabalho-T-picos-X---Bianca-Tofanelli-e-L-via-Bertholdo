import { QuestionRepository } from "./question.repository";

import { AppError } from "../../shared/errors/AppError";

import { CreateQuestionDTO } from "./dto/create-question.dto";
import { UpdateQuestionDTO } from "./dto/update-question.dto";

export class QuestionService {
  private repository =
    new QuestionRepository();

  async create(
    data: CreateQuestionDTO
  ) {
    return this.repository.create(data);
  }

  async findAll() {
    return this.repository.findAll();
  }

  async findById(id: string) {
    const question =
      await this.repository.findById(id);

    if (!question) {
      throw new AppError(
        "Questão não encontrada",
        404
      );
    }

    return question;
  }

  async update(
    id: string,
    data: UpdateQuestionDTO
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