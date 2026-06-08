import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// 1. SALVAR PROVA
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

// 2. DASHBOARD DO ALUNO (COM SISTEMA DE DIAGNÓSTICO NO TERMINAL)
router.get('/dashboard/aluno/:studentId', async (req, res) => {
  try {
    const idAluno = parseInt(req.params.studentId);
    
    const professoresAtivos = await prisma.user.findMany({ where: { role: 'PROFESSOR' } });
    const idsProfessoresAtivos = professoresAtivos.map(p => p.id);

    const todasProvas = await prisma.quiz.findMany();
    const submissoes = await prisma.submission.findMany({ where: { studentId: idAluno } });
    const idsProvasFeitas = submissoes.map(s => s.quizId);
    
    const now = new Date();

    const available = [];
    const missed = [];

    for (const q of todasProvas) {
      if (idsProvasFeitas.includes(q.id)) continue;
      if (!idsProfessoresAtivos.includes(q.professorId)) continue;

      const inicio = q.startDate ? new Date(q.startDate) : null;
      const fim = q.endDate ? new Date(q.endDate) : null;
      
      const jaComecou = !inicio || now >= inicio;
      const naoTerminou = !fim || now <= fim;

      if (jaComecou && naoTerminou) {
        available.push(q);
      } else if (fim && now > fim) {
        missed.push(q);
      }
    }

    const completed = submissoes.map(sub => {
      const quiz = todasProvas.find(q => q.id === sub.quizId);
      if (!quiz) return null;
      
      let liberado = false;
      if (quiz.feedbackStrategy === 'IMMEDIATE') liberado = true;
      if ((quiz.feedbackStrategy === 'AFTER_CLOSE' || quiz.feedbackStrategy === 'AFTER_DEADLINE') && now > new Date(quiz.endDate)) liberado = true;

      return {
        id: quiz.id,
        title: quiz.title,
        statusDaCorrecao: sub.status, 
        notaFinal: sub.score,
        podeVerResultado: liberado 
      };
    }).filter(Boolean);

    res.json({ available, completed, missed });
  } catch (error) {
    console.error(error);
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
    let temDissertativaRespondida = false; 
    let respostasCorrigidas = {};

    for (const link of prova.questions) {
      const q = link.question;
      const detalhes = JSON.parse(q.details); 
      const pesoDaQuestao = parseFloat(detalhes.peso || 1); 
      
      const respostaDoAluno = answers[q.id];
      let isCorrect = null; 

      if (q.type === 'MULTIPLE_CHOICE') {
        isCorrect = (respostaDoAluno === detalhes.correctOptionIndex);
        if (isCorrect) acertos += pesoDaQuestao; 
      } else if (q.type === 'TRUE_FALSE') {
        isCorrect = (respostaDoAluno === detalhes.correctAnswer);
        if (isCorrect) acertos += pesoDaQuestao; 
      } else if (q.type === 'ESSAY') {
        if (respostaDoAluno && typeof respostaDoAluno === 'string' && respostaDoAluno.trim() !== "") {
          temDissertativaRespondida = true;
        }
      }

      respostasCorrigidas[q.id] = { valor: respostaDoAluno, isCorrect };
    }

    const statusDaProva = temDissertativaRespondida ? "PENDING_REVIEW" : "GRADED";

    await prisma.submission.create({
      data: {
        quizId,
        studentId: parseInt(studentId),
        answers: JSON.stringify(respostasCorrigidas),
        score: acertos,
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

    const now = new Date();
    if (prova.startDate && now < new Date(prova.startDate)) {
      return res.status(403).json({ error: 'Esta prova ainda não está disponível.' });
    }
    if (prova.endDate && now > new Date(prova.endDate)) {
      return res.status(403).json({ error: 'O período desta prova já se encerrou.' });
    }

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
    const provinces = await prisma.quiz.findMany({
      where: { professorId: parseInt(professorId) },
      include: { questions: { include: { question: true } } }
    });
    const idsProvas = provinces.map(p => p.id);

    const pendentes = await prisma.submission.findMany({
      where: { quizId: { in: idsProvas }, status: 'PENDING_REVIEW' }
    });

    const tarefas = pendentes.map(sub => {
      const provaOrig = provinces.find(p => p.id === sub.quizId);
      const respostasAluno = JSON.parse(sub.answers);

      const dissertativas = provaOrig.questions
        .map(pq => pq.question)
        .filter(q => q.type === 'ESSAY')
        .filter(q => {
          const resp = respostasAluno[q.id]?.valor;
          return resp && typeof resp === 'string' && resp.trim() !== ""; 
        })
        .map(q => {
          const detalhes = JSON.parse(q.details);
          return {
            idQuestao: q.id,
            enunciado: q.content,
            rubrica: detalhes.rubric,
            pesoMaximo: parseFloat(detalhes.peso || 1), 
            respostaDoAluno: respostasAluno[q.id].valor
          };
        });

      return {
        submissaoId: sub.id,
        alunoId: sub.studentId, 
        provaTitulo: provaOrig.title,
        acertosAutomaticos: sub.score || 0,
        dissertativas
      };
    });

    const tarefasValidas = tarefas.filter(t => t.dissertativas.length > 0);

    res.json(tarefasValidas);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar pendências.' });
  }
});

// =======================================================================
// 👇 ROTAS DE CORREÇÃO DINÂMICAS PARA A FERRAMENTA DO PROFESSOR 👇
// =======================================================================

// 8.1 BUSCAR OS DADOS COMPLETOS DA SUBMISSÃO PARA O PROFESSOR LER
router.get('/submissions/:id/details', async (req, res) => {
  try {
    const subId = parseInt(req.params.id);
    const submissao = await prisma.submission.findUnique({
      where: { id: subId },
      include: {
        student: { select: { name: true, email: true } },
        quiz: { include: { questions: { include: { question: true } } } }
      }
    });
    
    if (!submissao) return res.status(404).json({ error: 'Submissão não encontrada.' });

    const questoes = submissao.quiz.questions.map(q => q.question);

    res.json({
      id: submissao.id,
      score: submissao.score,
      status: submissao.status,
      answers: JSON.parse(submissao.answers),
      aluno: submissao.student,
      questions: questoes
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao carregar detalhes da prova.' });
  }
});

// 8.2 RECEBER TODAS AS NOTAS (DE MÚLTIPLAS QUESTÕES) E CALCULAR SOMA FINAL
router.put('/submissions/:id/grade', async (req, res) => {
  try {
    const submissionId = parseInt(req.params.id);
    const { grades } = req.body; 

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId }
    });

    if (!submission) return res.status(404).json({ error: 'Submissão não encontrada.' });

    let respostasMapeadas = {};
    try { respostasMapeadas = JSON.parse(submission.answers); } catch (e) { }

    // 1. Atualiza a nota de cada questão individualmente no JSON
    for (const [questionId, update] of Object.entries(grades)) {
      if (!respostasMapeadas[questionId]) respostasMapeadas[questionId] = {};

      let notaSegura = parseFloat(String(update.score).replace(',', '.'));
      if (isNaN(notaSegura)) notaSegura = 0;

      respostasMapeadas[questionId].score = notaSegura;
      respostasMapeadas[questionId].feedback = update.feedback || '';
      respostasMapeadas[questionId].isCorrect = notaSegura > 0;
    }

    // 2. Recalcula a Nota Final juntando as Objetivas + Dissertativas Corrigidas
    const questoesDaProva = await prisma.quizQuestion.findMany({
      where: { quizId: submission.quizId },
      include: { question: true }
    });

    let novaNotaTotal = 0;

    questoesDaProva.forEach(qq => {
      const qId = qq.questionId;
      const qType = qq.question.type;
      const details = typeof qq.question.details === 'string' ? JSON.parse(qq.question.details) : (qq.question.details || {});
      const pesoOriginal = parseFloat(details.peso || 1);
      const respostaDoAluno = respostasMapeadas[qId];

      if (respostaDoAluno) {
        if (qType === 'ESSAY') {
          novaNotaTotal += parseFloat(respostaDoAluno.score || 0);
        } else {
          if (respostaDoAluno.isCorrect) novaNotaTotal += pesoOriginal;
        }
      }
    });

    // 3. Salva no banco de dados e fecha o status para "GRADED"
    const submissaoAtualizada = await prisma.submission.update({
      where: { id: submissionId },
      data: {
        answers: JSON.stringify(respostasMapeadas),
        score: novaNotaTotal,
        status: 'GRADED' 
      }
    });

    res.json({ message: 'Correção processada com sucesso!', submission: submissaoAtualizada });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro interno ao salvar a correção.' });
  }
});


// 9. PROFESSOR LER SUAS PROVAS
router.get('/professor/:professorId', async (req, res) => {
  try {
    const provinces = await prisma.quiz.findMany({
      where: { professorId: parseInt(req.params.professorId) }
    });

    const totalAlunos = await prisma.user.count({ where: { role: 'ALUNO' } });

    const provincesFormatadas = await Promise.all(provinces.map(async (q) => {
      const totalRespostas = await prisma.submission.count({ where: { quizId: q.id } });
      
      return {
        ...q,
        releaseMode: q.feedbackStrategy,
        isReleased: q.feedbackStrategy === 'IMMEDIATE',
        totalRespostas,
        totalAlunos
      };
    }));

    res.json(provincesFormatadas);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar provas.' });
  }
});

// 10. APAGAR UMA PROVA COMPLETAMENTE E EM CASCATA
router.delete('/:id', async (req, res) => {
  try {
    const idNumero = parseInt(req.params.id);
    
    // Deleta os históricos de correção pendentes e finalizados
    await prisma.submission.deleteMany({ where: { quizId: idNumero } });
    
    // Busca as questões para excluir permanentemente depois
    const questoes = await prisma.question.findMany({ where: { quizzes: { some: { quizId: idNumero } } } });
    const idsQuestoes = questoes.map(q => q.id);
    
    // Quebra a relação Muitos-para-Muitos
    await prisma.quizQuestion.deleteMany({ where: { quizId: idNumero } });
    
    // Apaga as questões físicas
    if (idsQuestoes.length > 0) {
      await prisma.question.deleteMany({ where: { id: { in: idsQuestoes } } });
    }
    
    // Apaga o Quiz
    await prisma.quiz.delete({ where: { id: idNumero } });
    
    res.json({ message: 'Prova excluída!' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao excluir.' });
  }
});

// 11. BUSCAR AS NOTAS DE UMA PROVA
router.get('/:id/notas', async (req, res) => {
  try {
    const notas = await prisma.submission.findMany({
      where: { quizId: parseInt(req.params.id) },
      select: { id: true, studentId: true, score: true, status: true }
    });
    res.json(notas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar as notas da turma.' });
  }
});

export default router;