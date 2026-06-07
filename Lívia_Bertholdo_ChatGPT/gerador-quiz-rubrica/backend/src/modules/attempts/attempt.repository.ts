import { prisma } from "../../config/prisma";

export class AttemptRepository {
  async create(
    quizId: string,
    studentId: string
  ) {
    return prisma.attempt.create({
      data: {
        quizId,
        studentId,
      },
    });
  }

  async findById(id: string) {
    return prisma.attempt.findUnique({
      where: {
        id,
      },
      include: {
        quiz: true,
        answers: true,
      },
    });
  }

  async findStudentAttempt(
    quizId: string,
    studentId: string
  ) {
    return prisma.attempt.findFirst({
      where: {
        quizId,
        studentId,
      },
    });
  }

  async finish(id: string) {
    return prisma.attempt.update({
      where: {
        id,
      },
      data: {
        status: "FINISHED",
        finishedAt: new Date(),
      },
    });
  }
}