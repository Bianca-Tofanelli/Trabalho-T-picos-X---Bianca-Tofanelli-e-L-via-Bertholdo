import { prisma } from "../../config/prisma";

import { AppError } from "../../shared/errors/AppError";

export class ReportService {
  async quizMetrics(
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
      });

    const totalStudents =
      attempts.length;

    const scores =
      attempts.map(
        (attempt) =>
          attempt.score ?? 0
      );

    const averageScore =
      scores.length
        ? scores.reduce(
            (a, b) => a + b,
            0
          ) / scores.length
        : 0;

    const highestScore =
      scores.length
        ? Math.max(...scores)
        : 0;

    const lowestScore =
      scores.length
        ? Math.min(...scores)
        : 0;

    return {
      quizId,
      title: quiz.title,
      totalStudents,
      averageScore,
      highestScore,
      lowestScore,
    };
  }

  async questionPerformance(
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

    const questions =
      await prisma.question.findMany({
        where: {
          quizId,
        },
        include: {
          answers: true,
        },
      });

    return questions.map(
      (question) => {
        const totalAnswers =
          question.answers.length;

        const correctAnswers =
          question.answers.filter(
            (answer) =>
              answer.isCorrect ===
              true
          ).length;

        const wrongAnswers =
          totalAnswers -
          correctAnswers;

        const accuracy =
          totalAnswers > 0
            ? Number(
                (
                  (correctAnswers /
                    totalAnswers) *
                  100
                ).toFixed(2)
              )
            : 0;

        return {
          questionId:
            question.id,
          statement:
            question.statement,
          totalAnswers,
          correctAnswers,
          wrongAnswers,
          accuracy,
        };
      }
    );
  }
}