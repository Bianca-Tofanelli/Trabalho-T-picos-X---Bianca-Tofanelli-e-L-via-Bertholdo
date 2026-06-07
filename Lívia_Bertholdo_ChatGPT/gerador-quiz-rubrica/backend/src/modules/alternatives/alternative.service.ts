import { prisma } from "../../config/prisma";

import { AppError } from "../../shared/errors/AppError";

import { AlternativeRepository } from "./alternative.repository";

import { CreateAlternativeDTO } from "./dto/create-alternative.dto";
import { UpdateAlternativeDTO } from "./dto/update-alternative.dto";

export class AlternativeService {
  private repository =
    new AlternativeRepository();

  async create(
    data: CreateAlternativeDTO
  ) {
    const question =
      await prisma.question.findUnique({
        where: {
          id: data.questionId,
        },
      });

    if (!question) {
      throw new AppError(
        "Questão não encontrada",
        404
      );
    }

    if (
      question.type ===
      "DISSERTATIVE"
    ) {
      throw new AppError(
        "Questões dissertativas não possuem alternativas",
        400
      );
    }

    if (data.isCorrect) {
      const correctCount =
        await this.repository.countCorrectAlternatives(
          data.questionId
        );

      if (correctCount >= 1) {
        throw new AppError(
          "Já existe uma alternativa correta",
          400
        );
      }
    }

    return this.repository.create(data);
  }

  async findByQuestion(
    questionId: string
  ) {
    return this.repository.findByQuestion(
      questionId
    );
  }

  async update(
    id: string,
    data: UpdateAlternativeDTO
  ) {
    const alternative =
      await this.repository.findById(id);

    if (!alternative) {
      throw new AppError(
        "Alternativa não encontrada",
        404
      );
    }

    return this.repository.update(
      id,
      data
    );
  }

  async delete(id: string) {
    const alternative =
      await this.repository.findById(id);

    if (!alternative) {
      throw new AppError(
        "Alternativa não encontrada",
        404
      );
    }

    await this.repository.delete(id);
  }
}