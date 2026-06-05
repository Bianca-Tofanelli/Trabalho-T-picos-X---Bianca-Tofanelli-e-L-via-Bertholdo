import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// 1. SALVAR PROVA + QUESTÕES
router.post('/', async (req, res) => {
  try {
    const { title, duration, professorId, questions } = req.body;
    
    // Criamos a prova primeiro
    const novaProva = await prisma.quiz.create({
      data: {
        title,
        duration: parseInt(duration),
        startDate: new Date(), 
        endDate: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000), 
        professorId: parseInt(professorId),
      }
    });

    // Se o professor enviou questões, salvamos cada uma passando pela Tabela Intermediária
    if (questions && questions.length > 0) {
      for (const q of questions) {
        await prisma.question.create({
          data: {
            content: q.content,
            type: q.type,
            details: JSON.stringify(q.details),
            professor: {
              connect: { id: parseInt(professorId) }
            },
            // 👇 A MÁGICA ESTÁ AQUI: Dizemos ao Prisma para CRIAR o vínculo na tabela intermediária 👇
            quizzes: {
              create: {
                quizId: novaProva.id
              }
            }
          }
        });
      }
    }

    res.status(201).json({ message: "Prova e questões criadas com sucesso!", novaProva });
  } catch (error) {
    console.error("Erro ao salvar prova:", error);
    res.status(500).json({ error: 'Erro interno ao criar a prova e questões.' });
  }
});

// 2. ROTA PARA O ALUNO LER AS PROVAS DISPONÍVEIS
router.get('/disponiveis', async (req, res) => {
  try {
    const provas = await prisma.quiz.findMany();
    res.json(provas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar as provas.' });
  }
});

// 3. ROTA PARA O PROFESSOR LER SUAS PROVAS
router.get('/professor/:professorId', async (req, res) => {
  try {
    const { professorId } = req.params;
    const provas = await prisma.quiz.findMany({
      where: { professorId: parseInt(professorId) }
    });
    res.json(provas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar as provas do professor.' });
  }
});

// 4. BUSCAR UMA PROVA ESPECÍFICA (PARA A TELA DO ALUNO)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'ID inválido.' });
    }

    const prova = await prisma.quiz.findUnique({
      where: { id: parseInt(id) },
      // 👇 Passamos pela tabela intermediária ('questions') para incluir a 'question' real 👇
      include: { 
        questions: {
          include: { question: true }
        }
      } 
    });

    if (!prova) {
      return res.status(404).json({ error: 'Prova não encontrada.' });
    }

    // Formata os dados para o Frontend (Tira a camada da tabela intermediária e converte os detalhes)
    const provaFormatada = {
      ...prova,
      questions: prova.questions.map(pq => ({
        ...pq.question,
        details: JSON.parse(pq.question.details) 
      }))
    };

    res.json(provaFormatada);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar os detalhes da prova.' });
  }
});

// 5. ROTA PARA APAGAR UMA PROVA
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const idNumero = parseInt(id);

    if (isNaN(idNumero)) {
      return res.status(400).json({ error: 'ID inválido.' });
    }

    await prisma.question.deleteMany({
      where: {
        quizzes: {
          some: { quizId: idNumero }
        }
      }
    });

    await prisma.quiz.delete({
      where: { id: idNumero }
    });

    res.json({ message: 'Prova excluída com sucesso!' });
  } catch (error) {
    console.error("Erro ao excluir prova:", error);
    res.status(500).json({ error: 'Erro ao tentar excluir a prova do banco.' });
  }
});

export default router;