import { useState, useEffect } from 'react';

export default function TeacherDashboard() {
  const [quizzes, setQuizzes] = useState([]);
  const [pendentes, setPendentes] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [notasExpandidas, setNotasExpandidas] = useState({});

  const userId = localStorage.getItem('userId');

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

  const handleAvaliar = async (submissaoId, acertosAutomaticos) => {
    const notaStr = window.prompt(`Esta prova já garantiu ${acertosAutomaticos} ponto(s) nas questões fechadas.\nQuantos pontos você dá para as respostas dissertativas?`);
    if (notaStr === null) return; 
    const nota = parseFloat(notaStr.replace(',', '.')); 
    if (isNaN(nota)) return alert("Por favor, digite um número válido!");
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
      console.error(err); // 💡 Corrigido: O ESLint agora vai ficar feliz!
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
                  <p className="font-bold text-gray-800 mb-2">Pergunta:</p>
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
                onClick={() => handleAvaliar(pendencia.submissaoId, pendencia.acertosAutomaticos)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-sm"
              >
                Atribuir Nota da Dissertativa e Finalizar
              </button>
            </div>
          ))}
        </div>
      </div>

      <hr className="border-gray-200" />

      {/* SEÇÃO 2: RELATÓRIO GERAL DE PROVAS (COM VISUALIZAÇÃO DE NOTAS NA TELA) */}
      <div>
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Relatório Geral da Turma</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {quizzes.map((quiz) => (
            <div key={quiz.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <h2 className="text-xl font-bold mb-2 text-gray-900">{quiz.title}</h2>
              <p className="text-gray-600 mb-6 font-medium">Duração: {quiz.duration} minutos</p>
              
              <div className="flex flex-col gap-3">
                
                <button 
                  onClick={() => toggleNotas(quiz.id)}
                  className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold py-3 px-4 rounded-xl flex items-center justify-center transition-colors border border-blue-200"
                >
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

                <button 
                  onClick={() => handleDownloadCSV(quiz.id)}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center transition-colors"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Baixar Relatório (CSV)
                </button>

                {quiz.releaseMode === 'MANUAL' && !quiz.isReleased && (
                  <button 
                    onClick={() => handleLiberarResultados(quiz.id)}
                    className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center transition-colors shadow-sm"
                  >
                    🔓 Liberar Notas e Gabaritos
                  </button>
                )}

                <button 
                  onClick={() => handleDeleteQuiz(quiz.id)}
                  className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-bold py-3 px-4 rounded-xl flex items-center justify-center transition-colors border border-red-200"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Excluir Prova
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}