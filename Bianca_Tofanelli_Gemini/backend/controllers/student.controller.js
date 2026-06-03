// controllers/student.controller.js (Atualização do submitQuiz)
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function submitQuiz(req, res) {
  const { quizId } = req.params;
  const { answers } = req.body; // Formato esperado: { "id_da_questao": "resposta_do_aluno" }
  const alunoId = req.user.userId;

  try {
    const submission = await prisma.submission.findFirst({
      where: { quizId, alunoId },
      include: { 
        quiz: {
          include: { questions: { include: { question: true } } }
        } 
      }
    });

    if (!submission || submission.answers !== "[]") {
      return res.status(400).json({ error: 'Prova não iniciada ou já enviada.' });
    }

    let totalScore = 0;
    let requiresManualGrading = false;
    const gradedAnswers = {};

    // Algoritmo de Auto-Grading
    submission.quiz.questions.forEach(q => {
      const question = q.question;
      const studentAnswer = answers[question.id];
      const details = JSON.parse(question.details);

      let isCorrect = false;
      let earnedPoints = 0;

      if (question.type === 'MULTIPLE_CHOICE') {
        isCorrect = studentAnswer === details.correctOptionIndex;
        earnedPoints = isCorrect ? 1 : 0; // Simplificação: 1 ponto por questão
        totalScore += earnedPoints;
      } 
      else if (question.type === 'TRUE_FALSE') {
        isCorrect = studentAnswer === details.correctAnswer;
        earnedPoints = isCorrect ? 1 : 0;
        totalScore += earnedPoints;
      } 
      else if (question.type === 'ESSAY') {
        requiresManualGrading = true;
        earnedPoints = null; // Ficará null até o professor corrigir
      }

      gradedAnswers[question.id] = {
        providedAnswer: studentAnswer,
        isCorrect,
        earnedPoints,
        teacherFeedback: null // Espaço reservado para a rubrica
      };
    });

    await prisma.submission.update({
      where: { id: submission.id },
      data: { 
        answers: JSON.stringify(gradedAnswers),
        score: requiresManualGrading ? null : totalScore, // Só fecha a nota se não houver dissertativa
        gradedAt: requiresManualGrading ? null : new Date()
      }
    });

    return res.json({ message: 'Prova enviada e processada com sucesso!' });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao processar respostas.' });
  }
}
// controllers/student.controller.js (Novo Endpoint)

export async function getResult(req, res) {
  const { quizId } = req.params;
  const alunoId = req.user.userId;
  const now = new Date();

  try {
    const submission = await prisma.submission.findFirst({
      where: { quizId, alunoId },
      include: { quiz: true }
    });

    if (!submission) return res.status(404).json({ error: 'Submissão não encontrada.' });

    const quiz = submission.quiz;
    const isPastEnd = now >= new Date(quiz.endDate);

    // REGRA DE NEGÓCIO BLINDADA NO SERVIDOR
    if (quiz.feedbackStrategy === 'AFTER_CLOSE' && !isPastEnd) {
      return res.status(403).json({ 
        status: 'LOCKED',
        message: 'O gabarito e a nota final só estarão disponíveis após o encerramento do prazo da prova.',
        availableAt: quiz.endDate
      });
    }

    // Se passou da trava, libera tudo
    return res.json({
      status: 'AVAILABLE',
      score: submission.score,
      gradedAt: submission.gradedAt,
      answers: JSON.parse(submission.answers)
    });

  } catch (error) {
    return res.status(500).json({ error: 'Erro ao buscar resultado.' });
  }
}