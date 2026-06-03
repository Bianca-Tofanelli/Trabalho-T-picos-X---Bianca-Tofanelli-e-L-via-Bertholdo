// controllers/grading.controller.js (Novo Arquivo)
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function gradeEssayQuestions(req, res) {
  const { submissionId } = req.params;
  const { grades } = req.body; // Formato: { "id_da_questao": { score: 2, feedback: "Muito bom, mas faltou X" } }
  
  try {
    const submission = await prisma.submission.findUnique({ where: { id: submissionId } });
    if (!submission) return res.status(404).json({ error: 'Submissão não encontrada.' });

    const currentAnswers = JSON.parse(submission.answers);
    let totalScore = 0;

    // Atualiza o JSON de respostas com a avaliação do professor
    for (const [questionId, gradingData] of Object.entries(grades)) {
      if (currentAnswers[questionId]) {
        currentAnswers[questionId].earnedPoints = gradingData.score;
        currentAnswers[questionId].teacherFeedback = gradingData.feedback;
      }
    }

    // Recalcula a nota total
    Object.values(currentAnswers).forEach(answer => {
      totalScore += (answer.earnedPoints || 0);
    });

    await prisma.submission.update({
      where: { id: submissionId },
      data: {
        answers: JSON.stringify(currentAnswers),
        score: totalScore,
        gradedAt: new Date()
      }
    });

    return res.json({ message: 'Avaliação salva com sucesso!', finalScore: totalScore });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao salvar avaliação manual.' });
  }
}