import { useState, useEffect } from 'react';
import API_URL from '../apiConfig';
// 👇 O SEGREDO: Importando a ferramenta de correção para dentro do Dashboard! 👇
import TeacherGradingTool from './TeacherGradingTool'; 

export default function TeacherDashboard() {
  const [quizzes, setQuizzes] = useState([]);
  const [pendentes, setPendentes] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [notasExpandidas, setNotasExpandidas] = useState({});
  const [agora, setAgora] = useState(new Date());

  // 👇 NOVA LÓGICA: Variáveis para controlar a navegação e atualização automática
  const [refreshKey, setRefreshKey] = useState(0); 
  const [gradingSubmissionId, setGradingSubmissionId] = useState(null);

  const userId = localStorage.getItem('userId');

  useEffect(() => {
    const intervalo = setInterval(() => setAgora(new Date()), 60000);
    return () => clearInterval(intervalo);
  }, []);

  // O useEffect agora escuta o refreshKey. Se ele mudar, o painel recarrega os dados!
  useEffect(() => {
    let isMounted = true; 

    const carregarPainel = async () => {
      try {
        const resQuizzes = await fetch(`${API_URL}/api/quizzes/professor/${userId}`);
        const dataQuizzes = resQuizzes.ok ? await resQuizzes.json() : [];

        const resPendentes = await fetch(`${API_URL}/api/quizzes/professor/${userId}/pendentes`);
        const dataPendentes = resPendentes.ok ? await resPendentes.json() : [];

        if (isMounted) {
          setQuizzes(dataQuizzes);
          setPendentes(dataPendentes);
        }
      } catch (err) {
        console.error(err); 
        if (isMounted) setError('Falha de conexão ao carregar os dados do painel.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (userId) carregarPainel();

    return () => { isMounted = false; };
  }, [userId, refreshKey]); 

  const formatarTempo = (dataAlvo) => {
    const diff = new Date(dataAlvo) - agora;
    if (diff <= 0) return "0 minutos";
    
    const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
    const horas = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (dias > 0) return `${dias} dia(s) e ${horas}h`;
    if (horas > 0) return `${horas}h e ${minutos}m`;
    return `${minutos} minuto(s)`;
  };

  const getStatusProva = (startDate, endDate) => {
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;

    if (start && agora < start) {
      return { label: 'Agendada', cor: 'text-yellow-700 bg-yellow-100 border-yellow-300', icon: '⏳', texto: `Abre em: ${formatarTempo(start)}` };
    }
    if (end && agora > end) {
      return { label: 'Encerrada', cor: 'text-gray-700 bg-gray-100 border-gray-300', icon: '🏁', texto: 'O prazo final já passou.' };
    }
    return { label: 'Em Andamento', cor: 'text-green-700 bg-green-100 border-green-300', icon: '🟢', texto: `Encerra em: ${formatarTempo(end)}` };
  };

  const handleDownloadCSV = async (quizId) => {
    try {
      const response = await fetch(`${API_URL}/api/reports/quizzes/${quizId}/export`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!response.ok) throw new Error('Falha ao baixar o arquivo');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `relatorio_turma_${quizId}.csv`); 
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err); 
      alert('Erro ao fazer o download do relatório em Excel.');
    }
  };

  const handleGeneratePDF = async (quizId) => {
    // ... Todo o código do PDF continua exatamente igual ...
    try {
      const response = await fetch(`${API_URL}/api/reports/quizzes/${quizId}/json`);
      if (!response.ok) throw new Error('Falha ao carregar dados para o PDF');
      const data = await response.json();

      const printWindow = window.open('', '_blank');
      
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Relatório - ${data.quiz.titulo}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @media print {
              @page { margin: 15mm; }
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .page-break { page-break-inside: avoid; }
              .page-break-before { page-break-before: always; }
            }
          </style>
        </head>
        <body class="bg-white text-gray-900 font-sans p-6">
          <div class="border-b-4 border-blue-600 pb-6 mb-8 flex justify-between items-end">
            <div>
              <h1 class="text-4xl font-black text-gray-800 tracking-tight">Relatório de Rendimento</h1>
              <h2 class="text-2xl font-semibold text-gray-500 mt-2">${data.quiz.titulo}</h2>
            </div>
            <div class="text-right text-gray-500 text-sm font-medium">
              <p>Gerado em: ${new Date().toLocaleDateString('pt-BR')}</p>
              <p>Duração da Prova: ${data.quiz.duracao} minutos</p>
            </div>
          </div>
          <div class="grid grid-cols-3 gap-6 mb-10">
            <div class="bg-gray-50 border border-gray-200 p-5 rounded-xl text-center">
              <p class="text-sm text-gray-500 font-bold uppercase tracking-wider mb-1">Matriculados</p>
              <p class="text-3xl font-black text-blue-600">${data.metricas.totalAlunos}</p>
            </div>
            <div class="bg-gray-50 border border-gray-200 p-5 rounded-xl text-center">
              <p class="text-sm text-gray-500 font-bold uppercase tracking-wider mb-1">Provas Entregues</p>
              <p class="text-3xl font-black text-green-600">${data.metricas.totalFeitas}</p>
            </div>
            <div class="bg-gray-50 border border-gray-200 p-5 rounded-xl text-center">
              <p class="text-sm text-gray-500 font-bold uppercase tracking-wider mb-1">Faltas</p>
              <p class="text-3xl font-black text-red-600">${data.metricas.totalFaltas}</p>
            </div>
          </div>
          <div class="mb-12">
            <h3 class="text-xl font-bold text-gray-800 border-b-2 border-gray-100 pb-2 mb-4">Notas Finais da Turma</h3>
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-gray-100 text-gray-600 uppercase text-xs tracking-wider">
                  <th class="p-4 rounded-tl-lg">ID</th>
                  <th class="p-4">Nome do Aluno</th>
                  <th class="p-4">Status</th>
                  <th class="p-4 rounded-tr-lg text-right">Nota Final</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                ${data.alunos.map(aluno => `
                  <tr class="page-break hover:bg-gray-50">
                    <td class="p-4 text-sm font-medium text-gray-500">${aluno.id}</td>
                    <td class="p-4 font-bold text-gray-800">${aluno.nome}</td>
                    <td class="p-4">
                      <span class="px-3 py-1 rounded-full text-xs font-bold ${
                        aluno.status === 'Corrigida' ? 'bg-green-100 text-green-800' :
                        aluno.status === 'Faltou' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                      }">
                        ${aluno.status}
                      </span>
                    </td>
                    <td class="p-4 text-right font-black text-lg ${aluno.status === 'Faltou' ? 'text-red-500' : 'text-gray-900'}">
                      ${aluno.nota}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          <div class="page-break-before pt-4">
            <h3 class="text-xl font-bold text-gray-800 border-b-2 border-gray-100 pb-2 mb-4">Engenharia da Avaliação (Análise de Itens)</h3>
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-blue-50 text-blue-800 uppercase text-xs tracking-wider border-b border-blue-200">
                  <th class="p-4 rounded-tl-lg">Questão</th>
                  <th class="p-4 text-center">Peso</th>
                  <th class="p-4 text-center">Índice de Acerto</th>
                  <th class="p-4 rounded-tr-lg">Distribuição das Respostas Cadastradas</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                ${data.questoes && data.questoes.map(q => {
                  const valorPorcentagem = parseFloat(q.acertos);
                  const corBadge = q.acertos.includes('N/A') ? 'bg-gray-100 text-gray-600' : 
                                   valorPorcentagem < 50.0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700';
                  return `
                    <tr class="page-break hover:bg-gray-50">
                      <td class="p-4">
                        <p class="font-bold text-gray-800">Questão ${q.numero}</p>
                        <p class="text-xs text-gray-500 font-medium">${q.tipo}</p>
                      </td>
                      <td class="p-4 text-center font-bold text-gray-700">${q.peso} pts</td>
                      <td class="p-4 text-center">
                        <span class="px-3 py-1 rounded-lg text-xs font-black ${corBadge}">
                          ${q.acertos}
                        </span>
                      </td>
                      <td class="p-4 text-xs font-medium text-gray-600 leading-relaxed max-w-md">
                        ${q.distribuicao}
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
          <div class="text-center text-gray-400 text-xs mt-12 border-t border-gray-100 pt-4">
            <p>Documento gerado automaticamente pelo Sistema de Avaliações.</p>
          </div>
        </body>
        </html>
      `;
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      setTimeout(() => { printWindow.print(); }, 700);
    } catch (err) {
      console.error(err);
      alert('Erro ao tentar gerar o documento PDF analítico.');
    }
  };

  const handleDeleteQuiz = async (quizId) => {
    const confirmar = window.confirm("Tem certeza que deseja apagar esta prova?");
    if (!confirmar) return;
    try {
      const response = await fetch(`${API_URL}/api/quizzes/${quizId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Erro ao apagar.');
      
      // Remove visualmente para ser rápido
      setQuizzes(prev => prev.filter(quiz => quiz.id !== quizId));
      
      // 🛡️ A MÁGICA: Força o useEffect a rodar novamente, limpando as correções pendentes da tela!
      setRefreshKey(prev => prev + 1);
      
      alert("Prova e histórico apagados com sucesso!");
    } catch (err) {
      console.error(err); 
      alert("Erro ao tentar excluir a prova.");
    }
  };

  const handleLiberarResultados = async (quizId) => {
    const confirmar = window.confirm("Deseja liberar as notas e o gabarito desta prova para todos os alunos agora?");
    if (!confirmar) return;
    try {
      const response = await fetch(`${API_URL}/api/quizzes/${quizId}/liberar`, { method: 'PATCH' });
      if (!response.ok) throw new Error('Erro ao liberar.');
      alert("Resultados liberados com sucesso!");
      setQuizzes(prev => prev.map(q => q.id === quizId ? { ...q, isReleased: true } : q));
    } catch (err) {
      console.error(err);
      alert("Erro ao tentar liberar os resultados.");
    }
  };

  const toggleNotas = async (quizId) => {
    setNotasExpandidas(prev => {
      if (prev[quizId]) {
        const novoEstado = { ...prev };
        delete novoEstado[quizId];
        return novoEstado;
      }
      return prev; 
    });

    if (!notasExpandidas[quizId]) {
      try {
        const response = await fetch(`${API_URL}/api/quizzes/${quizId}/notas`);
        if (response.ok) {
          const notas = await response.json();
          setNotasExpandidas(prev => ({ ...prev, [quizId]: notas }));
        }
      } catch (err) {
        console.error(err);
        alert("Não foi possível carregar as notas no momento.");
      }
    }
  };

  // 👇 RENDERIZAÇÃO CONDICIONAL: Se o professor clicou em avaliar, mostra o Ferramenta de Correção em vez do Dashboard!
  if (gradingSubmissionId) {
    return (
      <TeacherGradingTool 
        submissionId={gradingSubmissionId} 
        onBack={() => {
          setGradingSubmissionId(null); // Volta para o Dashboard
          setRefreshKey(prev => prev + 1); // Recarrega as pendências (a prova que ele acabou de corrigir vai sumir)
        }} 
      />
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-10">
      
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 font-bold shadow-sm">
          ⚠️ {error}
        </div>
      )}

      {/* SEÇÃO 1: CORREÇÕES PENDENTES */}
      <div>
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Provas Aguardando Correção</h1>
        
        {!loading && pendentes.length === 0 && (
          <div className="text-center py-8 bg-green-50 text-green-700 border border-green-200 rounded-2xl font-medium">
            🎉 Oba! Nenhuma prova pendente. O seu trabalho está em dia!
          </div>
        )}

        <div className="grid gap-6">
          {pendentes.map((pendencia) => (
            <div key={pendencia.submissaoId} className="bg-yellow-50 p-6 rounded-2xl shadow-sm border border-yellow-200">
              <div className="flex justify-between items-start border-b border-yellow-200 pb-4 mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{pendencia.provaTitulo}</h2>
                  <p className="text-sm text-gray-600">ID do Aluno: {pendencia.alunoId}</p>
                </div>
                <div className="text-right">
                  <span className="block text-sm text-gray-500">Acertos Automáticos:</span>
                  <span className="text-2xl font-black text-blue-600">{pendencia.acertosAutomaticos} pts</span>
                </div>
              </div>

              {pendencia.dissertativas.map((diss, index) => (
                <div key={index} className="mb-4 bg-white p-4 rounded-xl border border-gray-100 opacity-75">
                  <p className="font-bold text-gray-800 mb-2">Pergunta <span className="text-gray-400 font-normal text-sm">(Vale {diss.pesoMaximo.toFixed(1)} pts)</span>:</p>
                  <p className="text-gray-700 line-clamp-2">{diss.enunciado}</p>
                </div>
              ))}

              {/* 👇 O NOVO BOTÃO: Em vez de pedir a nota aqui, ele abre o TeacherGradingTool! 👇 */}
              <button 
                onClick={() => setGradingSubmissionId(pendencia.submissaoId)}
                className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                📝 Abrir Ferramenta de Correção Detalhada
              </button>
            </div>
          ))}
        </div>
      </div>

      <hr className="border-gray-200" />

      {/* SEÇÃO 2: RELATÓRIO GERAL */}
      <div>
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Relatório Geral da Turma</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {quizzes.map((quiz) => {
            const status = getStatusProva(quiz.startDate, quiz.endDate);
            const total = quiz.totalAlunos || 0;
            const respostas = quiz.totalRespostas || 0;
            const progresso = total > 0 ? Math.round((respostas / total) * 100) : 0;

            return (
              <div key={quiz.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-xl font-bold text-gray-900 leading-tight">{quiz.title}</h2>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full border ${status.cor} flex items-center whitespace-nowrap ml-3`}>
                      <span className="mr-1">{status.icon}</span> {status.label}
                    </span>
                  </div>
                  
                  <div className="mb-6 bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <p className="text-sm font-bold text-gray-700">{status.texto}</p>
                    <p className="text-xs text-gray-500 mt-1">Duração da prova: {quiz.duration} minutos</p>
                  </div>

                  <div className="mb-6">
                    <div className="flex justify-between text-sm font-bold text-gray-700 mb-1">
                      <span>Respostas: {respostas} de {total} alunos</span>
                      <span>{progresso}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div className="bg-blue-500 h-3 rounded-full transition-all duration-500" style={{ width: `${progresso}%` }}></div>
                    </div>
                    {total - respostas > 0 && status.label !== 'Encerrada' && (
                      <p className="text-xs text-orange-600 font-medium mt-1">Faltam {total - respostas} alunos entregarem.</p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-3 mt-auto">
                  <button onClick={() => toggleNotas(quiz.id)} className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold py-3 px-4 rounded-xl transition-colors border border-blue-200">
                    {notasExpandidas[quiz.id] ? 'Ocultar Notas' : 'Ver Notas da Turma'}
                  </button>

                  {notasExpandidas[quiz.id] && (
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mt-2 mb-2">
                      <h4 className="font-bold text-gray-800 border-b border-gray-200 pb-2 mb-2">Pontuações:</h4>
                      {notasExpandidas[quiz.id].length === 0 ? (
                        <p className="text-sm text-gray-500 italic">Nenhum aluno realizou esta prova ainda.</p>
                      ) : (
                        <ul className="space-y-2">
                          {notasExpandidas[quiz.id].map(nota => (
                            <li key={nota.id} className="flex justify-between items-center text-sm bg-white p-2 rounded border border-gray-100">
                              <span className="text-gray-700">Aluno ID: <strong>{nota.studentId}</strong></span>
                              {nota.status === 'GRADED' ? (
                                <span className="font-bold text-green-600">{nota.score} pts</span>
                              ) : (
                                <span className="font-medium text-orange-500 italic">Pendente</span>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button onClick={() => handleDownloadCSV(quiz.id)} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-2 rounded-xl flex items-center justify-center transition-colors text-sm">
                      Baixar (CSV)
                    </button>
                    
                    <button onClick={() => handleGeneratePDF(quiz.id)} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-2 rounded-xl flex items-center justify-center transition-colors text-sm">
                      📄 Gerar PDF
                    </button>
                  </div>

                  {quiz.releaseMode === 'MANUAL' && !quiz.isReleased && (
                    <button onClick={() => handleLiberarResultados(quiz.id)} className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-sm">
                      🔓 Liberar Notas
                    </button>
                  )}

                  <button onClick={() => handleDeleteQuiz(quiz.id)} className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-bold py-3 px-4 rounded-xl transition-colors border border-red-200">
                    Excluir Prova
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}