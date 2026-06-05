import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// 1. SALVAR PROVA + QUESTÕES (Professor)
router.post('/', async (req, res) => {
  try {
    const { title, duration, professorId, questions } = req.body;
    
    const novaProva = await prisma.quiz.create({
      data: {
        title,
        duration: parseInt(duration),
        startDate: new Date(), 
        endDate: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000), 
        professorId: parseInt(professorId),
      }
    });

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
            quizzes: {
              create: { quizId: novaProva.id }
            }
          }
        });
      }
    }
    res.status(201).json({ message: "Prova criada com sucesso!", novaProva });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro interno ao criar a prova.' });
  }
});

// 2. 👇 NOVA ROTA: DASHBOARD INTELIGENTE DO ALUNO 👇
router.get('/dashboard/aluno/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const idAluno = parseInt(studentId);

    // Busca todas as provas do sistema
    const todasProvas = await prisma.quiz.findMany();

    // Busca quais provas esse aluno específico já entregou
    const submissoes = await prisma.submission.findMany({
      where: { studentId: idAluno }
    });

    // Cria uma lista apenas com os IDs das provas concluídas
    const idsProvasFeitas = submissoes.map(s => s.quizId);

    // Filtra as provas usando a lista de IDs
    const available = todasProvas.filter(q => !idsProvasFeitas.includes(q.id));
    const completed = todasProvas.filter(q => idsProvasFeitas.includes(q.id));

    // Devolve o objeto exatamente na estrutura que o seu Frontend espera!
    res.json({ available, completed, missed: [] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao carregar o painel do aluno.' });
  }
});

// 3. 👇 NOVA ROTA: RECEBER E SALVAR AS RESPOSTAS DO ALUNO 👇
router.post('/:id/submeter', async (req, res) => {
  try {
    const { id } = req.params;
    const { studentId, answers } = req.body;

    await prisma.submission.create({
      data: {
        quizId: parseInt(id),
        studentId: parseInt(studentId),
        answers: JSON.stringify(answers) // Salva o objeto de respostas como texto
      }
    });

    res.status(201).json({ message: "Respostas gravadas com sucesso!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao salvar a submissão da prova.' });
  }
});

// 4. ROTA PARA O PROFESSOR LER SUAS PROVAS
router.get('/professor/:professorId', async (req, res) => {
  try {
    const { professorId } = req.params;
    const provinces = await prisma.quiz.findMany({
      where: { professorId: parseInt(professorId) }
    });
    res.json(provinces);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar as provas.' });
  }
});

// 5. BUSCAR UMA PROVA ESPECÍFICA COM AS QUESTÕES (Aluno)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (isNaN(parseInt(id))) return res.status(400).json({ error: 'ID inválido.' });

    const prova = await prisma.quiz.findUnique({
      where: { id: parseInt(id) },
      include: { 
        questions: { include: { question: true } }
      } 
    });

    if (!prova) return res.status(404).json({ error: 'Prova não encontrada.' });

    res.json({
      ...prova,
      questions: prova.questions.map(pq => ({
        ...pq.question,
        details: JSON.parse(pq.question.details) 
      }))
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar detalhes da prova.' });
  }
});

// 6. ROTA PARA APAGAR UMA PROVA COMPLETAMENTE
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const idNumero = parseInt(id);
    
    if (isNaN(idNumero)) return res.status(400).json({ error: 'ID inválido.' });

    // 1º passo: Apagar as submissões/entregas dos alunos
    await prisma.submission.deleteMany({
      where: { quizId: idNumero }
    });

    // 2º passo: Salvar os IDs das questões para podermos apagar depois
    const questoes = await prisma.question.findMany({
      where: { quizzes: { some: { quizId: idNumero } } }
    });
    const idsQuestoes = questoes.map(q => q.id);

    // 3º passo: QUEBRAR A PONTE! Apagar os registros da tabela intermediária (QuizQuestion)
    // É isso aqui que vai remover o erro de "Foreign Key Constraint"
    await prisma.quizQuestion.deleteMany({
      where: { quizId: idNumero }
    });

    // 4º passo: Agora que a ponte sumiu, as questões estão destravadas e podem ser apagadas
    if (idsQuestoes.length > 0) {
      await prisma.question.deleteMany({
        where: { id: { in: idsQuestoes } }
      });
    }

    // 5º passo: Finalmente, apagar a prova
    await prisma.quiz.delete({ 
      where: { id: idNumero } 
    });
    
    res.json({ message: 'Prova excluída com sucesso!' });
  } catch (error) {
    console.error("Erro ao excluir:", error);
    res.status(500).json({ error: 'Erro ao tentar excluir a prova do banco.' });
  }
});
export default router;