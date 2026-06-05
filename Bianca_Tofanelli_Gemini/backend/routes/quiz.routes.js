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
// 3. ROTA: RECEBER E CORRIGIR AS RESPOSTAS DO ALUNO AUTOMATICAMENTE
router.post('/:id/submeter', async (req, res) => {
  try {
    const { id } = req.params;
    const quizId = parseInt(id);
    const { studentId, answers } = req.body;

    // 1. Busca a prova e os gabaritos oficiais no banco de dados
    const prova = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: { include: { question: true } }
      }
    });

    if (!prova) return res.status(404).json({ error: 'Prova não encontrada.' });

    let acertos = 0;
    let temDissertativa = false;
    let respostasCorrigidas = {};

    // 2. O Robô Corretor: Analisa cada resposta do aluno
    for (const link of prova.questions) {
      const q = link.question;
      const detalhes = JSON.parse(q.details); // Abre o JSON onde estão as opções/gabarito
      const respostaDoAluno = answers[q.id];

      let isCorrect = null; // null = precisa do professor (Dissertativa)

      if (q.type === 'MULTIPLE_CHOICE') {
        isCorrect = (respostaDoAluno === detalhes.correctOptionIndex);
        if (isCorrect) acertos += 1;
      } 
      else if (q.type === 'TRUE_FALSE') {
        isCorrect = (respostaDoAluno === detalhes.correctAnswer);
        if (isCorrect) acertos += 1;
      } 
      else if (q.type === 'ESSAY') {
        temDissertativa = true;
      }

      // Salva a resposta original do aluno E se o sistema já validou que está certa/errada
      respostasCorrigidas[q.id] = {
        valor: respostaDoAluno,
        isCorrect: isCorrect 
      };
    }

    // 3. Define o status da prova dinamicamente
    // Se não tiver dissertativa, a prova está 100% corrigida e ganha a nota.
    const statusDaProva = temDissertativa ? "PENDING_REVIEW" : "GRADED";
    const notaCalculada = temDissertativa ? null : acertos;

    // 4. Salva a entrega completa no banco de dados
    await prisma.submission.create({
      data: {
        quizId: quizId,
        studentId: parseInt(studentId),
        answers: JSON.stringify(respostasCorrigidas), // Salvamos a resposta já enriquecida
        score: notaCalculada,
        status: statusDaProva
      }
    });

    res.status(201).json({ message: "Prova submetida e processada com sucesso!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao salvar e corrigir a prova.' });
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
// 7. ROTA: BUSCAR PROVAS AGUARDANDO CORREÇÃO (Professor)
router.get('/professor/:professorId/pendentes', async (req, res) => {
  try {
    const { professorId } = req.params;

    // Acha as provas criadas por esse professor, trazendo as perguntas junto
    const provas = await prisma.quiz.findMany({
      where: { professorId: parseInt(professorId) },
      include: { questions: { include: { question: true } } }
    });
    const idsProvas = provas.map(p => p.id);

    // Acha as submissões (entregas) que estão com status pendente
    const pendentes = await prisma.submission.findMany({
      where: { quizId: { in: idsProvas }, status: 'PENDING_REVIEW' }
    });

    // Monta um "pacote" perfeito para o Frontend exibir
    const tarefas = pendentes.map(sub => {
      const provaOrig = provas.find(p => p.id === sub.quizId);
      const respostasAluno = JSON.parse(sub.answers);

      // Filtra apenas as questões do tipo ESSAY (Dissertativas)
      const dissertativas = provaOrig.questions
        .map(pq => pq.question)
        .filter(q => q.type === 'ESSAY')
        .map(q => ({
          idQuestao: q.id,
          enunciado: q.content,
          rubrica: JSON.parse(q.details).rubric,
          respostaDoAluno: respostasAluno[q.id]?.valor || "Deixou em branco"
        }));

      return {
        submissaoId: sub.id,
        alunoId: sub.studentId, // Num sistema real teríamos o nome da pessoa
        provaTitulo: provaOrig.title,
        acertosAutomaticos: sub.score || 0, // A nota que o robô já calculou
        dissertativas
      };
    });

    res.json(tarefas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar pendências.' });
  }
});

// 8. ROTA: RECEBER A NOTA DA DISSERTATIVA E FINALIZAR A PROVA
router.post('/submissao/:id/avaliar', async (req, res) => {
  try {
    const { id } = req.params;
    const { notaProfessor } = req.body;

    const submissao = await prisma.submission.findUnique({ where: { id: parseInt(id) } });

    // Soma a nota do robô com a nota que o professor acabou de dar
    const notaFinal = (submissao.score || 0) + parseFloat(notaProfessor);

    // Atualiza a prova para GRADED (Corrigida) e salva a nota final
    await prisma.submission.update({
      where: { id: parseInt(id) },
      data: {
        score: notaFinal,
        status: 'GRADED'
      }
    });

    res.json({ message: 'Nota salva com sucesso!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao avaliar prova.' });
  }
});
export default router;