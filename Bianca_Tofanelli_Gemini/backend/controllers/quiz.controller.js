// controllers/quiz.controller.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function createQuiz(req, res) {
  const { 
    title, 
    description, 
    duration, 
    startDate, 
    endDate, 
    feedbackStrategy, 
    questionIds 
  } = req.body;
  
  const professorId = req.user.userId; // Injetado pelo middleware de autenticação

  try {
    // ---- VALIDAÇÕES DE REGRA DE NEGÓCIO ----
    
    if (!questionIds || !Array.isArray(questionIds) || questionIds.length === 0) {
      return res.status(400).json({ error: 'Um Quiz precisa ter pelo menos uma questão.' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // 1. Validar integridade das datas
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ error: 'Formatos de data de início ou término inválidos.' });
    }

    // 2. Data de término deve ser após a data de início
    if (end <= start) {
      return res.status(400).json({ error: 'A data de término deve ser posterior à data de início.' });
    }

    // 3. Duração deve ser um número positivo
    const durationMinutes = parseInt(duration, 10);
    if (isNaN(durationMinutes) || durationMinutes <= 0) {
      return res.status(400).json({ error: 'A duração do Quiz deve ser um valor maior que zero.' });
    }

    // 4. Verificar se todas as questões selecionadas realmente existem e pertencem ao professor
    const validQuestionsCount = await prisma.question.count({
      where: {
        id: { in: questionIds },
        professorId: professorId
      }
    });

    if (validQuestionsCount !== questionIds.length) {
      return res.status(400).json({ 
        error: 'Uma ou mais questões selecionadas não foram encontradas no seu banco de questões.' 
      });
    }

    // ---- PERSISTÊNCIA NO BANCO DE DADOS ----
    
    // Usamos o nested write do Prisma para criar o Quiz e preencher a tabela pivô QuizQuestion em uma única transação
    const newQuiz = await prisma.quiz.create({
      data: {
        title,
        description,
        duration: durationMinutes,
        startDate: start,
        endDate: end,
        feedbackStrategy,
        professorId,
        questions: {
          create: questionIds.map(id => ({
            questionId: id
          }))
        }
      },
      include: {
        questions: true // Inclui os relacionamentos criados no retorno do JSON para validação
      }
    });

    return res.status(201).json({
      message: 'Quiz criado com sucesso!',
      quiz: newQuiz
    });

  } catch (error) {
    console.error('Erro ao criar Quiz:', error);
    return res.status(500).json({ error: 'Erro interno ao salvar as configurações do Quiz.' });
  }
}