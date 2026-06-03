// controllers/report.controller.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 1. Endpoint de Estatísticas do Quiz (JSON para o Dashboard)
export async function getQuizStatistics(req, res) {
  const { quizId } = req.params;
  const professorId = req.user.userId;

  try {
    // Busca o Quiz validando se pertence ao professor, e traz as submissões com as questões
    const quiz = await prisma.quiz.findFirst({
      where: { id: quizId, professorId },
      include: {
        questions: { include: { question: true } },
        submissions: true
      }
    });

    if (!quiz) return res.status(404).json({ error: 'Quiz não encontrado ou acesso negado.' });

    const submissions = quiz.submissions;
    if (submissions.length === 0) {
      return res.json({ message: 'Nenhuma submissão recebida ainda.', stats: null });
    }

    // --- CÁLCULO DE NOTAS ---
    // Filtramos apenas submissões que já têm nota (ignorando as pendentes de correção dissertativa)
    const gradedSubmissions = submissions.filter(s => s.score !== null);
    const scores = gradedSubmissions.map(s => s.score);
    
    const maxScore = scores.length > 0 ? Math.max(...scores) : 0;
    const minScore = scores.length > 0 ? Math.min(...scores) : 0;
    const avgScore = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2) : 0;

    // --- ANÁLISE POR QUESTÃO ---
    const questionStats = {};

    // Inicializa a estrutura de dados para cada questão
    quiz.questions.forEach(q => {
      questionStats[q.questionId] = {
        content: q.question.content,
        type: q.question.type,
        totalAnswers: 0,
        correctCount: 0,
        wrongCount: 0,
        optionsDistribution: {} // Para contar quantas vezes a Letra A, B, C foi escolhida
      };
    });

    // Varre todas as provas enviadas para contabilizar
    submissions.forEach(sub => {
      const answers = JSON.parse(sub.answers); // Lembrando que no SQLite salvamos como String
      
      for (const [qId, answerData] of Object.entries(answers)) {
        if (!questionStats[qId]) continue;
        
        const stat = questionStats[qId];
        stat.totalAnswers++;

        if (answerData.isCorrect) stat.correctCount++;
        else if (answerData.isCorrect === false) stat.wrongCount++; // Ignora dissertativas (null)

        // Se for múltipla escolha, contabiliza qual alternativa foi marcada
        if (stat.type === 'MULTIPLE_CHOICE' && answerData.providedAnswer !== null) {
          const optionIndex = answerData.providedAnswer;
          stat.optionsDistribution[optionIndex] = (stat.optionsDistribution[optionIndex] || 0) + 1;
        }
      }
    });

    // Transforma contagens em porcentagens para facilitar pro Frontend
    const detailedAnalysis = Object.entries(questionStats).map(([id, data]) => {
      const errorRate = data.totalAnswers > 0 ? ((data.wrongCount / data.totalAnswers) * 100).toFixed(1) : 0;
      return { questionId: id, ...data, errorRate: `${errorRate}%` };
    });

    return res.json({
      totalSubmissions: submissions.length,
      gradedSubmissions: gradedSubmissions.length,
      scoreStats: { max: maxScore, min: minScore, average: parseFloat(avgScore) },
      questionAnalysis: detailedAnalysis
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao gerar estatísticas.' });
  }
}

// 2. Endpoint de Exportação (CSV On-The-Fly)
export async function downloadQuizResultsCSV(req, res) {
  const { quizId } = req.params;
  const professorId = req.user.userId;

  try {
    const quiz = await prisma.quiz.findFirst({
      where: { id: quizId, professorId },
      include: {
        questions: { include: { question: true } },
        submissions: { include: { aluno: true } } // Precisamos dos dados do aluno agora
      }
    });

    if (!quiz) return res.status(404).json({ error: 'Quiz não encontrado.' });

    // Função auxiliar de Engenharia para limpar strings no CSV (evita que vírgulas no texto quebrem a tabela)
    const escapeCSV = (field) => {
      if (field === null || field === undefined) return 'Pendente';
      const str = String(field);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`; // Escapa aspas duplas
      }
      return str;
    };

    // 1. Construir a linha de Cabeçalho (Headers)
    const headers = ['Nome do Aluno', 'Email', 'Data de Envio', 'Nota Final'];
    quiz.questions.forEach((q, index) => {
      headers.push(`Q${index + 1} - Pontos`);
    });

    const csvRows = [];
    csvRows.push(headers.join(',')); // Adiciona o cabeçalho como primeira linha

    // 2. Construir as linhas de Dados (uma para cada aluno)
    quiz.submissions.forEach(sub => {
      const answers = JSON.parse(sub.answers);
      const submissionDate = new Date(sub.createdAt).toLocaleDateString('pt-BR');
      
      const row = [
        escapeCSV(sub.aluno.name),
        escapeCSV(sub.aluno.email),
        escapeCSV(submissionDate),
        escapeCSV(sub.score)
      ];

      // Adiciona a nota de cada questão individualmente
      quiz.questions.forEach(q => {
        const answerData = answers[q.questionId];
        row.push(escapeCSV(answerData?.earnedPoints));
      });

      csvRows.push(row.join(','));
    });

    // 3. Juntar tudo em uma grande string separada por quebras de linha
    const csvString = csvRows.join('\n');

    // 4. Mágica do HTTP: Configurar os cabeçalhos para forçar o download
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="resultados_quiz_${quizId}.csv"`);
    
    // Devolve o arquivo diretamente na resposta
    return res.send(csvString);

  } catch (error) {
    return res.status(500).json({ error: 'Erro ao gerar o arquivo CSV.' });
  }
}