import { useState, useEffect } from 'react';

export default function TeacherDashboard() {
  const [quizzes, setQuizzes] = useState([]);
  const [pendentes, setPendentes] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [notasExpandidas, setNotasExpandidas] = useState({});
  const [agora, setAgora] = useState(new Date());

  const userId = localStorage.getItem('userId');

  useEffect(() => {
    const intervalo = setInterval(() => setAgora(new Date()), 60000);
    return () => clearInterval(intervalo);
  }, []);

  useEffect(() => {
    const carregarPainel = async () => {
      try {
        const resQuizzes = await fetch(`/api/quizzes/professor/${userId}`);
        if (resQuizzes.ok) setQuizzes(await resQuizzes.json());

        const resPendentes = await fetch(`/api/quizzes/professor/${userId}/pendentes`);
        if (resPendentes.ok) setPendentes(await resPendentes.json());
      } catch (err) {
        console.error(err); 
        setError('Falha de conexão ao carregar os dados do painel.');
      } finally {
        setLoading(false);
      }
    };

    if (userId) carregarPainel();
  }, [userId]);

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
      const response = await fetch(`/api/reports/quizzes/${quizId}/export`, {
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
      alert('Erro ao fazer o download do relatório.');
    }
  };

  const handleDeleteQuiz = async (quizId) => {
    const confirmar = window.confirm("Tem certeza que deseja apagar esta prova?");
    if (!confirmar) return;
    try {
      const response = await fetch(`/api/quizzes/${quizId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Erro ao apagar.');
      setQuizzes(quizzes.filter(quiz => quiz.id !== quizId));
    } catch (err) {
      console.error(err); 
      alert("Erro ao tentar excluir a prova.");
    }
  };

  const handleLiberarResultados = async (quizId) => {
    const confirmar = window.confirm("Deseja liberar as notas e o gabarito desta prova para todos os alunos agora?");
    if (!confirmar) return;
    try {
      const response = await fetch(`/api/quizzes/${quizId}/liberar`, { method: 'PATCH' });
      if (!response.ok) throw new Error('Erro ao liberar.');
      alert("Resultados liberados com sucesso!");
      setQuizzes(quizzes.map(q => q.id === quizId ? { ...q, isReleased: true } : q));
    } catch (err) {
      console.error(err);
      alert("Erro ao tentar liberar os resultados.");
    }
  };

  // 👇 FUNÇÃO DE AVALIAR ATUALIZADA COM TRAVA DE NOTA 👇
  const handleAvaliar = async (submissaoId, acertosAutomaticos, dissertativasDoAluno) => {
    const totalPossivel = dissertativasDoAluno.reduce((acc, curr) => acc + curr.pesoMaximo, 0);

    const notaStr = window.prompt(`Esta prova já garantiu ${acertosAutomaticos.toFixed(1)} pontos.\nA(s) questão(ões) dissertativa(s) do aluno vale(m) no máximo ${totalPossivel.toFixed(1)} pontos.\n\nQuantos pontos você dá para ele?`);
    
    if (notaStr === null) return; 
    
    const nota = parseFloat(notaStr.replace(',', '.')); 
    if (isNaN(nota)) return alert("Por favor, digite um número válido!");

    // 🚨 TRAVA DE SEGURANÇA: Não deixa passar de 10 nem dar nota negativa 🚨
    if (nota < 0 || nota > totalPossivel) {
      return alert(`⚠️ Ação bloqueada: A nota atribuída deve ser entre 0 e ${totalPossivel.toFixed(1)}!`);
    }

    try {
      const res = await fetch(`/api/quizzes/submissao/${submissaoId}/avaliar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notaProfessor: nota })
      });
      if (!res.ok) throw new Error("Falha no servidor.");
      alert("Avaliação concluída! A nota final já está com o aluno.");
      setPendentes(pendentes.filter(p => p.submissaoId !== submissaoId));
    } catch (err) {
      console.error(err); 
      alert("Erro de conexão ao salvar a nota.");
    }
  };

  const toggleNotas = async (quizId) => {
    if (notasExpandidas[quizId]) {
      const novoEstado = { ...notasExpandidas };
      delete novoEstado[quizId];
      setNotasExpandidas(novoEstado);
      return;
    }
    try {
      const response = await fetch(`/api/quizzes/${quizId}/notas`);
      if (response.ok) {
        const notas = await response.json();
        setNotasExpandidas({ ...notasExpandidas, [quizId]: notas });
      }
    } catch (err) {
      console.error(err);
      alert("Não foi possível carregar as notas no momento.");
    }
  };

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
                <div key={index} className="mb-6 bg-white p-4 rounded-xl border border-gray-100">
                  <p className="font-bold text-gray-800 mb-2">Pergunta <span className="text-gray-400 font-normal text-sm">(Vale {diss.pesoMaximo.toFixed(1)} pts)</span>:</p>
                  <p className="text-gray-700 mb-4 whitespace-pre-wrap">{diss.enunciado}</p>
                  
                  <div className="bg-blue-50 p-3 rounded-lg mb-4 text-sm border border-blue-100">
                    <span className="font-bold text-blue-800">Sua Rubrica de Correção: </span>
                    <span className="text-blue-700">{diss.rubrica || "Sem rubrica cadastrada."}</span>
                  </div>

                  <p className="font-bold text-gray-800 mb-2">Resposta do Aluno:</p>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-200">{diss.respostaDoAluno}</p>
                </div>
              ))}

              <button 
                onClick={() => handleAvaliar(pendencia.submissaoId, pendencia.acertosAutomaticos, pendencia.dissertativas)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-sm"
              >
                Atribuir Nota da Dissertativa e Finalizar
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

                  <button onClick={() => handleDownloadCSV(quiz.id)} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center transition-colors">
                    Baixar Relatório (CSV)
                  </button>

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