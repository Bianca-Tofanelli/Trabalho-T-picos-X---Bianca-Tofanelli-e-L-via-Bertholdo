import { useState, useEffect } from 'react';

export default function TeacherDashboard() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const userId = localStorage.getItem('userId');

  useEffect(() => {
    const buscarProvas = async () => {
      try {
        const response = await fetch(`/api/quizzes/professor/${userId}`);
        if (!response.ok) throw new Error('Falha ao carregar as provas.');
        
        const data = await response.json();
        setQuizzes(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (userId) buscarProvas();
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

    } catch (error) {
      alert('Erro ao fazer o download do relatório.');
      console.error(error);
    }
  };

  // 👇 NOVA FUNÇÃO PARA APAGAR A PROVA 👇
  const handleDeleteQuiz = async (quizId) => {
    // Pede uma confirmação para o professor não apagar sem querer
    const confirmar = window.confirm("Tem certeza que deseja apagar esta prova? Ela sumirá para os alunos também. Esta ação não pode ser desfeita.");
    
    if (!confirmar) return;

    try {
      const response = await fetch(`/api/quizzes/${quizId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (!response.ok) throw new Error('Erro ao apagar a prova.');

      // Se deu certo no banco, a gente remove a prova da tela do professor imediatamente
      setQuizzes(quizzes.filter(quiz => quiz.id !== quizId));
      alert("Prova apagada com sucesso!");

    } catch (error) {
      alert("Erro ao tentar excluir a prova.");
      console.error(error);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Painel de Relatórios da Turma</h1>
      
      {loading && <p className="text-gray-500 font-medium">Buscando suas provas no sistema...</p>}
      {error && <p className="text-red-500 bg-red-50 p-4 rounded-lg font-medium">{error}</p>}

      {!loading && !error && quizzes.length === 0 && (
        <div className="text-center py-12 bg-white text-gray-500 border-2 border-dashed border-gray-200 rounded-2xl">
          Você ainda não criou nenhuma prova. Acesse a aba "Criar Prova" para começar.
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {quizzes.map((quiz) => (
          <div key={quiz.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <h2 className="text-xl font-bold mb-2 text-gray-900">{quiz.title}</h2>
            <p className="text-gray-600 mb-6 font-medium">Duração: {quiz.duration} minutos</p>
            
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => handleDownloadCSV(quiz.id)}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Baixar Relatório (CSV)
              </button>

              {/* 👇 NOVO BOTÃO DE EXCLUIR 👇 */}
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
  );
}