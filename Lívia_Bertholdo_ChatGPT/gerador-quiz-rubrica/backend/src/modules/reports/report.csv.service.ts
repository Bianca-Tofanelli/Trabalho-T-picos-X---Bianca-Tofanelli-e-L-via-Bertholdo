import { prisma } from "../../config/prisma";

import { AppError } from "../../shared/errors/AppError";

export class ReportCsvService {
  async generateQuizCsv(
    quizId: string
  ) {
    const quiz =
      await prisma.quiz.findUnique({
        where: {
          id: quizId,
        },
      });

    if (!quiz) {
      throw new AppError(
        "Quiz não encontrado",
        404
      );
    }

    const attempts =
      await prisma.attempt.findMany({
        where: {
          quizId,
          status: "FINISHED",
        },
        include: {
          student: true,
        },
      });

    const rows = [
      "Aluno,Nota",
    ];

    attempts.forEach(
      (attempt) => {
        rows.push(
          `${attempt.student.name},${attempt.score ?? 0}`
        );
      }
    );

    return rows.join("\n");
  }
}