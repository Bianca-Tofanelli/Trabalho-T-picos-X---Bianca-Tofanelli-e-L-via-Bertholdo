import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// 1. SALVAR PROVA (Com as datas corrigidas)
router.post('/', async (req, res) => {
  try {
    const { title, duration, startDate, endDate, professorId, questions, releaseMode } = req.body;
    
    const novaProva = await prisma.quiz.create({
      data: {
        title,
        duration: parseInt(duration),
        startDate: startDate ? new Date(startDate) : new Date(), 
        endDate: endDate ? new Date(endDate) : new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000), 
        professorId: parseInt(professorId),
        feedbackStrategy: releaseMode || 'IMMEDIATE'
      }
    });

    if (questions && questions.length > 0) {
      for (const q of questions) {
        await prisma.question.create({
          data: {
            content: q.content,
            type: q.type,
            details: JSON.stringify(q.details),
            professor: { connect: { id: parseInt(professorId) } },
            quizzes: { create: { quizId: novaProva.id } }
          }
        });
      }
    }
    res.status(201).json({ message: "Prova criada com sucesso!", novaProva });
  } catch (error) {
    console.error("ERRO FATAL AO CRIAR PROVA:", error);
    res.status(500).json({ error: 'Erro interno ao criar a prova.' });
  }
});

// 2. DASHBOARD DO ALUNO
router.get('/dashboard/aluno/:studentId', async (req, res) => {
  try {
    const idAluno = parseInt(req.params.studentId);
    const todasProvas = await prisma.quiz.findMany();
    const submissoes = await prisma.submission.findMany({ where: { studentId: idAluno } });

    const idsProvasFeitas = submissoes.map(s => s.quizId);
    const available = todasProvas.filter(q => !idsProvasFeitas.includes(q.id));
    
    const completed = submissoes.map(sub => {
      const quiz = todasProvas.find(q => q.id === sub.quizId);
      
      let liberado = false;
      if (quiz.feedbackStrategy === 'IMMEDIATE') liberado = true;
      if ((quiz.feedbackStrategy === 'AFTER_CLOSE' || quiz.feedbackStrategy === 'AFTER_DEADLINE') && new Date() > new Date(quiz.endDate)) liberado = true;

      return {
        id: quiz.id,
        title: quiz.title,
        statusDaCorrecao: sub.status, 
        notaFinal: sub.score,
        podeVerResultado: liberado 
      };
    });

    res.json({ available, completed, missed: [] });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao carregar o painel.' });
  }
});

// 3. SUBMETER E CORRIGIR A PROVA AUTOMATICAMENTE
router.post('/:id/submeter', async (req, res) => {
  try {
    const quizId = parseInt(req.params.id);
    const { studentId, answers } = req.body;

    const prova = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: { questions: { include: { question: true } } }
    });

    let acertos = 0;
    let temDissertativa = false;
    let respostasCorrigidas = {};

    for (const link of prova.questions) {
      const q = link.question;
      const detalhes = JSON.parse(q.details); 
      const respostaDoAluno = answers[q.id];
      let isCorrect = null; 

      if (q.type === 'MULTIPLE_CHOICE') {
        isCorrect = (respostaDoAluno === detalhes.correctOptionIndex);
        if (isCorrect) acertos += 1;
      } else if (q.type === 'TRUE_FALSE') {
        isCorrect = (respostaDoAluno === detalhes.correctAnswer);
        if (isCorrect) acertos += 1;
      } else if (q.type === 'ESSAY') {
        temDissertativa = true;
      }

      respostasCorrigidas[q.id] = { valor: respostaDoAluno, isCorrect };
    }

    const statusDaProva = temDissertativa ? "PENDING_REVIEW" : "GRADED";
    const notaCalculada = temDissertativa ? null : acertos;

    await prisma.submission.create({
      data: {
        quizId,
        studentId: parseInt(studentId),
        answers: JSON.stringify(respostasCorrigidas),
        score: notaCalculada,
        status: statusDaProva
      }
    });

    res.status(201).json({ message: "Prova submetida!" });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao corrigir.' });
  }
});

// 4. BUSCAR A PROVA COM O GABARITO
router.get('/:id/resultado/:studentId', async (req, res) => {
  try {
    const { id, studentId } = req.params;
    const prova = await prisma.quiz.findUnique({
      where: { id: parseInt(id) },
      include: { questions: { include: { question: true } } }
    });
    const submissao = await prisma.submission.findFirst({
      where: { quizId: parseInt(id), studentId: parseInt(studentId) }
    });
    if (!prova || !submissao) return res.status(404).json({ error: 'Resultado não encontrado.' });

    res.json({
      prova: { ...prova, questions: prova.questions.map(pq => ({ ...pq.question, details: JSON.parse(pq.question.details) })) },
      entrega: { nota: submissao.score, status: submissao.status, respostas: JSON.parse(submissao.answers) }
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar resultado.' });
  }
});

// 5. BUSCAR PROVA PARA RESPONDER (ANTI-COLA)
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const prova = await prisma.quiz.findUnique({
      where: { id },
      include: { questions: { include: { question: true } } } 
    });
    if (!prova) return res.status(404).json({ error: 'Prova não encontrada.' });

    res.json({
      ...prova,
      questions: prova.questions.map(pq => {
        const detalhes = JSON.parse(pq.question.details);
        delete detalhes.correctOptionIndex;
        delete detalhes.correctAnswer;
        delete detalhes.rubric; 
        return { ...pq.question, details: detalhes };
      })
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar prova.' });
  }
});

// 6. LIBERAR O RESULTADO MANUALMENTE
router.patch('/:id/liberar', async (req, res) => {
  try {
    const prova = await prisma.quiz.update({
      where: { id: parseInt(req.params.id) },
      data: { feedbackStrategy: 'IMMEDIATE' } 
    });
    res.json({ message: "Resultados liberados!", prova });
  } catch (error) {
    res.status(500).json({ error: "Erro ao liberar." });
  }
});

// 7. BUSCAR PROVAS AGUARDANDO CORREÇÃO
router.get('/professor/:professorId/pendentes', async (req, res) => {
  try {
    const { professorId } = req.params;
    const provas = await prisma.quiz.findMany({
      where: { professorId: parseInt(professorId) },
      include: { questions: { include: { question: true } } }
    });
    const idsProvas = provas.map(p => p.id);

    const pendentes = await prisma.submission.findMany({
      where: { quizId: { in: idsProvas }, status: 'PENDING_REVIEW' }
    });

    const tarefas = pendentes.map(sub => {
      const provaOrig = provas.find(p => p.id === sub.quizId);
      const respostasAluno = JSON.parse(sub.answers);

      const dissertativas = provaOrig.questions.map(pq => pq.question).filter(q => q.type === 'ESSAY').map(q => ({
          idQuestao: q.id,
          enunciado: q.content,
          rubrica: JSON.parse(q.details).rubric,
          respostaDoAluno: respostasAluno[q.id]?.valor || "Deixou em branco"
        }));

      return {
        submissaoId: sub.id,
        alunoId: sub.studentId, 
        provaTitulo: provaOrig.title,
        acertosAutomaticos: sub.score || 0,
        dissertativas
      };
    });

    res.json(tarefas);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar pendências.' });
  }
});

// 8. RECEBER A NOTA DA DISSERTATIVA E FINALIZAR A PROVA
router.post('/submissao/:id/avaliar', async (req, res) => {
  try {
    const { id } = req.params;
    const { notaProfessor } = req.body;
    const submissao = await prisma.submission.findUnique({ where: { id: parseInt(id) } });
    const notaFinal = (submissao.score || 0) + parseFloat(notaProfessor);

    await prisma.submission.update({
      where: { id: parseInt(id) },
      data: { score: notaFinal, status: 'GRADED' }
    });
    res.json({ message: 'Nota salva!' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao avaliar prova.' });
  }
});

// 9. PROFESSOR LER SUAS PROVAS 
router.get('/professor/:professorId', async (req, res) => {
  try {
    const provas = await prisma.quiz.findMany({
      where: { professorId: parseInt(req.params.professorId) }
    });
    const provasFormatadas = provas.map(q => ({
      ...q,
      releaseMode: q.feedbackStrategy,
      isReleased: q.feedbackStrategy === 'IMMEDIATE'
    }));
    res.json(provasFormatadas);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar provas.' });
  }
});

// 10. APAGAR UMA PROVA COMPLETAMENTE
router.delete('/:id', async (req, res) => {
  try {
    const idNumero = parseInt(req.params.id);
    await prisma.submission.deleteMany({ where: { quizId: idNumero } });
    const questoes = await prisma.question.findMany({ where: { quizzes: { some: { quizId: idNumero } } } });
    const idsQuestoes = questoes.map(q => q.id);
    await prisma.quizQuestion.deleteMany({ where: { quizId: idNumero } });
    if (idsQuestoes.length > 0) {
      await prisma.question.deleteMany({ where: { id: { in: idsQuestoes } } });
    }
    await prisma.quiz.delete({ where: { id: idNumero } });
    res.json({ message: 'Prova excluída!' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao excluir.' });
  }
});

// 👇 11. NOVA ROTA: BUSCAR AS NOTAS DE UMA PROVA 👇
router.get('/:id/notas', async (req, res) => {
  try {
    const notas = await prisma.submission.findMany({
      where: { quizId: parseInt(req.params.id) },
      select: { id: true, studentId: true, score: true, status: true } // Puxa só as informações de nota
    });
    res.json(notas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar as notas da turma.' });
  }
});

export default router;