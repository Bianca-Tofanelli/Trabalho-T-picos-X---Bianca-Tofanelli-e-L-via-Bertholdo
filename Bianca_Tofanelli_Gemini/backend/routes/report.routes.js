import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// 1. ROTA EXISTENTE: EXPORTAR RELATÓRIO EM CSV (EXCEL)
router.get('/quizzes/:quizId/export', async (req, res) => {
  try {
    const quizId = parseInt(req.params.quizId);

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: { questions: { include: { question: true } } }
    });

    if (!quiz) return res.status(404).json({ error: 'Avaliação não encontrada.' });

    const todosAlunos = await prisma.user.findMany({ where: { role: 'ALUNO' } });
    const submissoes = await prisma.submission.findMany({ where: { quizId: quizId } });

    const totalAlunos = todosAlunos.length;
    const totalFeitas = submissoes.length;
    const totalFaltas = totalAlunos - totalFeitas;

    let csv = "\ufeff"; 
    csv += "RELATÓRIO GERENCIAL DE RENDIMENTO E ENGAJAMENTO\n";
    csv += `Avaliação:;${quiz.title}\n`;
    csv += `Duração Limite:;${quiz.duration} minutos\n`;
    csv += `Total de Alunos Matriculados:;${totalAlunos}\n`;
    csv += `Provas Entregues (Feitas):;${totalFeitas}\n`;
    csv += `Alunos Ausentes (Faltas):;${totalFaltas}\n\n`;

    csv += "DESEMPENHO INDIVIDUAL DOS ALUNOS\n";
    let cabecalhoColunas = ["ID Aluno", "Nome Aluno", "Status da Prova", "Nota Final (0.0 a 10.0)"];
    quiz.questions.forEach((pq, index) => {
      cabecalhoColunas.push(`Q${index + 1} - Resposta do Aluno`, `Q${index + 1} - Resultado`);
    });
    csv += cabecalhoColunas.join(";") + "\n";

    todosAlunos.forEach(aluno => {
      const entrega = submissoes.find(s => s.studentId === aluno.id);
      let linha = [aluno.id, aluno.name];

      if (entrega) {
        const statusTexto = entrega.status === "GRADED" ? "Corrigida" : "Aguardando Nota Professor";
        const notaTexto = entrega.score !== null ? parseFloat(entrega.score).toFixed(1) : "Pendente";
        linha.push(statusTexto, notaTexto);

        const respostasDoAluno = JSON.parse(entrega.answers || "{}");

        quiz.questions.forEach(pq => {
          const q = pq.question;
          const ans = respostasDoAluno[q.id];

          if (!ans || ans.valor === undefined || ans.valor === null || ans.valor === "") {
            linha.push("Deixou em Branco", "Zerado (Falta de Resposta)");
          } else {
            let respostaFormatada = ans.valor;
            if (q.type === 'MULTIPLE_CHOICE') respostaFormatada = `Alternativa ${String.fromCharCode(65 + parseInt(ans.valor))}`;
            else if (q.type === 'TRUE_FALSE') respostaFormatada = ans.valor ? "Verdadeiro" : "Falso";
            else if (q.type === 'ESSAY') {
              respostaFormatada = typeof ans.valor === 'string' ? ans.valor.replace(/[\n\r;]/g, " ") : ans.valor;
              if (respostaFormatada.length > 40) respostaFormatada = respostaFormatada.substring(0, 37) + "...";
            }

            let resultadoCorrecao = q.type === 'ESSAY' ? "Avaliação Manual" : (ans.isCorrect ? "Correto" : "Incorreto");
            linha.push(respostaFormatada, resultadoCorrecao);
          }
        });
      } else {
        linha.push("FALTOU / AUSENTE", "0.0");
        quiz.questions.forEach(() => linha.push("Não Realizou", "Zerado"));
      }
      csv += linha.join(";") + "\n";
    });

    csv += "\n\nANÁLISE DE ENGENHARIA DA AVALIAÇÃO (ESTATÍSTICAS POR QUESTÃO)\n";
    csv += "Questão;Tipo de Questão;Valor (Peso);Índice de Acerto (%);Distribuição das Respostas Cadastradas\n";

    quiz.questions.forEach((pq, index) => {
      const q = pq.question;
      const detalhes = JSON.parse(q.details);
      const peso = parseFloat(detalhes.peso || 1).toFixed(1);

      let totalRespondido = 0;
      let totalAcertos = 0;
      let distribuicaoMap = {}; 

      submissoes.forEach(sub => {
        const respostasMap = JSON.parse(sub.answers || "{}");
        const ans = respostasMap[q.id];

        if (ans && ans.valor !== undefined && ans.valor !== null && ans.valor !== "") {
          totalRespondido++;
          if (ans.isCorrect) totalAcertos++;

          let rotuloEscolha = ans.valor;
          if (q.type === 'MULTIPLE_CHOICE') rotuloEscolha = `Alternativa ${String.fromCharCode(65 + parseInt(ans.valor))}`;
          else if (q.type === 'TRUE_FALSE') rotuloEscolha = ans.valor ? "Verdadeiro" : "Falso";
          else rotuloEscolha = "Respondido";
          
          distribuicaoMap[rotuloEscolha] = (distribuicaoMap[rotuloEscolha] || 0) + 1;
        } else {
          distribuicaoMap["Em Branco"] = (distribuicaoMap["Em Branco"] || 0) + 1;
        }
      });

      if (totalFaltas > 0) distribuicaoMap["Em Branco"] = (distribuicaoMap["Em Branco"] || 0) + totalFaltas;

      let indiceAcertoTexto = "0.0%";
      if (q.type === 'ESSAY') indiceAcertoTexto = "Correção Manual";
      else if (totalRespondido > 0) indiceAcertoTexto = `${((totalAcertos / totalRespondido) * 100).toFixed(1)}%`;

      let stringDistribuicao = Object.entries(distribuicaoMap).map(([opcao, qtde]) => `${opcao}: ${qtde} aluno(s)`).join(" | ");
      csv += `Questão ${index + 1};${q.type};${peso};${indiceAcertoTexto};[ ${stringDistribuicao} ]\n`;
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=relatorio_turma_prova_${quizId}.csv`);
    return res.status(200).send(csv);

  } catch (error) {
    res.status(500).json({ error: 'Erro interno.' });
  }
});

// 2. NOVA ROTA: GERAR DADOS ESTRUTURADOS PARA O PDF (Agora com Estatísticas!)
router.get('/quizzes/:quizId/json', async (req, res) => {
  try {
    const quizId = parseInt(req.params.quizId);

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: { questions: { include: { question: true } } }
    });

    if (!quiz) return res.status(404).json({ error: 'Avaliação não encontrada.' });

    const todosAlunos = await prisma.user.findMany({ where: { role: 'ALUNO' } });
    const submissoes = await prisma.submission.findMany({ where: { quizId: quizId } });

    const totalAlunos = todosAlunos.length;
    const totalFeitas = submissoes.length;
    const totalFaltas = totalAlunos - totalFeitas;

    // Processa os alunos
    const alunosProcessados = todosAlunos.map(aluno => {
      const entrega = submissoes.find(s => s.studentId === aluno.id);
      return {
        id: aluno.id,
        nome: aluno.name,
        status: entrega ? (entrega.status === "GRADED" ? "Corrigida" : "Pendente") : "Faltou",
        nota: entrega && entrega.score !== null ? parseFloat(entrega.score).toFixed(1) : (entrega ? "Pendente" : "0.0")
      };
    });

    // 👇 O MOTOR DE ESTATÍSTICA PARA O PDF 👇
    const questoesProcessadas = quiz.questions.map((pq, index) => {
      const q = pq.question;
      const detalhes = JSON.parse(q.details);
      const peso = parseFloat(detalhes.peso || 1).toFixed(1);

      let totalRespondido = 0;
      let totalAcertos = 0;
      let distribuicaoMap = {};

      submissoes.forEach(sub => {
        const respostasMap = JSON.parse(sub.answers || "{}");
        const ans = respostasMap[q.id];

        if (ans && ans.valor !== undefined && ans.valor !== null && ans.valor !== "") {
          totalRespondido++;
          if (ans.isCorrect) totalAcertos++;

          let rotuloEscolha = ans.valor;
          if (q.type === 'MULTIPLE_CHOICE') rotuloEscolha = `Alt. ${String.fromCharCode(65 + parseInt(ans.valor))}`;
          else if (q.type === 'TRUE_FALSE') rotuloEscolha = ans.valor ? "Verdadeiro" : "Falso";
          else rotuloEscolha = "Respondido";
          distribuicaoMap[rotuloEscolha] = (distribuicaoMap[rotuloEscolha] || 0) + 1;
        } else {
          distribuicaoMap["Em Branco"] = (distribuicaoMap["Em Branco"] || 0) + 1;
        }
      });

      if (totalFaltas > 0) distribuicaoMap["Em Branco"] = (distribuicaoMap["Em Branco"] || 0) + totalFaltas;

      let indiceAcertoTexto = "0.0%";
      if (q.type === 'ESSAY') indiceAcertoTexto = "N/A (Manual)";
      else if (totalRespondido > 0) indiceAcertoTexto = `${((totalAcertos / totalRespondido) * 100).toFixed(1)}%`;

      let stringDistribuicao = Object.entries(distribuicaoMap).map(([opcao, qtde]) => `${opcao}: ${qtde}`).join(" | ");

      return {
        numero: index + 1,
        tipo: q.type === 'MULTIPLE_CHOICE' ? 'Múltipla Escolha' : q.type === 'TRUE_FALSE' ? 'Verdadeiro/Falso' : 'Dissertativa',
        peso: peso,
        acertos: indiceAcertoTexto,
        distribuicao: stringDistribuicao
      };
    });

    res.json({
      quiz: { titulo: quiz.title, duracao: quiz.duration },
      metricas: { totalAlunos, totalFeitas, totalFaltas },
      alunos: alunosProcessados,
      questoes: questoesProcessadas // 👈 Enviando pro front!
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao gerar dados do PDF.' });
  }
});

export default router;