import { prisma } from "../../config/prisma";

import { AppError } from "../../shared/errors/AppError";

export class CorrectionService {
  async correctAnswer(
    answerId: string,
    score: number
  ) {
    const answer =
      await prisma.answer.findUnique({
        where: {
          id: answerId,
        },
        include: {
          question: true,
          attempt: {
            include: {
              answers: true,
            },
          },
        },
      });

    if (!answer) {
      throw new AppError(
        "Resposta não encontrada",
        404
      );
    }

    if (
      answer.question.type !==
      "DISSERTATIVE"
    ) {
      throw new AppError(
        "Somente questões dissertativas podem ser corrigidas manualmente",
        400
      );
    }

    await prisma.answer.update({
      where: {
        id: answerId,
      },
      data: {
        score,
        isCorrect: score > 0,
      },
    });

    const updatedAnswers =
      await prisma.answer.findMany({
        where: {
          attemptId:
            answer.attemptId,
        },
      });

    const totalScore =
      updatedAnswers.reduce(
        (sum, current) =>
          sum +
          (current.score ?? 0),
        0
      );

    await prisma.attempt.update({
      where: {
        id: answer.attemptId,
      },
      data: {
        score: totalScore,
      },
    });

    return {
      message:
        "Resposta corrigida com sucesso",
    };
  }
}