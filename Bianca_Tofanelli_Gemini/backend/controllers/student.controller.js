// controllers/student.controller.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 1. Dashboard do Aluno
export async function getDashboard(req, res) {
  const alunoId = req.user.userId;
  const now = new Date();

  try {
    // Busca todas as provas e as submissões deste aluno
    const quizzes = await prisma.quiz.findMany({
      include: {
        submissions: {
          where: { alunoId }
        }
      }
    });

    const dashboard = {
      available: [],
      completed: [],
      missed: []
    };

    quizzes.forEach(quiz => {
      const hasSubmitted = quiz.submissions.length > 0;
      const isPastEnd = now > new Date(quiz.endDate);
      const isBeforeStart = now < new Date(quiz.startDate);

      if (hasSubmitted) {
        // Se a prova já foi enviada, ou o gabarito é imediato, ou só após o fechamento
        const showFeedback = quiz.feedbackStrategy === 'IMMEDIATE' || isPastEnd;
        dashboard.completed.push({ ...quiz, showFeedback });
      } else if (isPastEnd) {
        dashboard.missed.push(quiz);
      } else if (!isBeforeStart) {
        dashboard.available.push(quiz);
      }
    });

    return res.json(dashboard);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao carregar dashboard.' });
  }
}

// 2. Iniciar Prova (Anti-Fraude de Tempo)
export async function startQuiz(req, res) {
  const { quizId } = req.params;
  const alunoId = req.user.userId;
  const now = new Date();

  try {
    const quiz = await prisma.quiz.findUnique({ 
      where: { id: quizId },
      include: { questions: { include: { question: true } } } 
    });

    if (!quiz) return res.status(404).json({ error: 'Quiz não encontrado.' });

    // Validação de Janela
    if (now < new Date(quiz.startDate) || now > new Date(quiz.endDate)) {
      return res.status(403).json({ error: 'Fora da janela de disponibilidade.' });
    }

    // Verifica se já iniciou
    let submission = await prisma.submission.findFirst({
      where: { quizId, alunoId }
    });

    if (!submission) {
      // CRAVA O RELÓGIO NO SERVIDOR: Cria a submissão vazia agora
      submission = await prisma.submission.create({
        data: {
          quizId,
          alunoId,
          answers: "[]" // SQLite armazena JSON como String
        }
      });
    } else if (submission.answers !== "[]") {
      return res.status(403).json({ error: 'Você já finalizou esta prova.' });
    }

    // Envia os dados para o frontend construir a tela (sem as respostas corretas, claro!)
    const safeQuestions = quiz.questions.map(q => {
      const details = JSON.parse(q.question.details);
      // Remove o gabarito para não vazar pro navegador do aluno
      delete details.correctOptionIndex; 
      delete details.correctAnswer;
      delete details.keywords;

      return {
        id: q.question.id,
        content: q.question.content,
        type: q.question.type,
        details
      };
    });

    return res.json({
      submissionId: submission.id,
      startedAt: submission.createdAt, // Frontend usará isso para calcular o tempo
      duration: quiz.duration,
      questions: safeQuestions
    });

  } catch (error) {
    return res.status(500).json({ error: 'Erro ao iniciar a prova.' });
  }
}

// 3. Enviar Respostas (Submissão Final)
export async function submitQuiz(req, res) {
  const { quizId } = req.params;
  const { answers } = req.body;
  const alunoId = req.user.userId;
  const now = new Date();

  try {
    const submission = await prisma.submission.findFirst({
      where: { quizId, alunoId },
      include: { quiz: true }
    });

    if (!submission || submission.answers !== "[]") {
      return res.status(400).json({ error: 'Prova não iniciada ou já enviada.' });
    }

    // VALIDAÇÃO ANTI-FRAUDE (Tolerância de 15 segundos para latência de rede)
    const startTime = new Date(submission.createdAt);
    const maxEndTime = new Date(startTime.getTime() + (submission.quiz.duration * 60000) + 15000);

    if (now > maxEndTime) {
      // Se passou do tempo, salvamos o que deu, mas podemos marcar com uma flag (aqui apenas salvamos)
      console.warn(`Aluno ${alunoId} enviou com atraso.`);
    }

    // Atualiza a submissão com as respostas reais
    await prisma.submission.update({
      where: { id: submission.id },
      data: { answers: JSON.stringify(answers) }
    });

    return res.json({ message: 'Prova enviada com sucesso!' });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao salvar respostas.' });
  }
}