import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// 1. ROTA PARA SALVAR A PROVA (O que faltava para o QuizCreator!)
router.post('/', async (req, res) => {
  try {
    const { title, duration, professorId } = req.body;
    
    const novaProva = await prisma.quiz.create({
      data: {
        title,
        duration: parseInt(duration),
        // Colocando datas padrão só para não dar erro no SQLite
        startDate: new Date(), 
        endDate: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000), 
        professorId: parseInt(professorId),
      }
    });

    res.status(201).json({ message: "Prova criada com sucesso!", novaProva });
  } catch (error) {
    console.error("Erro ao salvar prova:", error);
    res.status(500).json({ error: 'Erro interno ao criar a prova no banco.' });
  }
});

// 2. ROTA PARA O PROFESSOR LER SUAS PROVAS
router.get('/professor/:professorId', async (req, res) => {
  try {
    const { professorId } = req.params;
    const provas = await prisma.quiz.findMany({
      where: { professorId: parseInt(professorId) }
    });
    res.json(provas);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar as provas do professor.' });
  }
});

// 3. ROTA PARA O ALUNO LER AS PROVAS
router.get('/disponiveis', async (req, res) => {
  try {
    const provas = await prisma.quiz.findMany();
    res.json(provas);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar as provas.' });
  }
});

export default router;