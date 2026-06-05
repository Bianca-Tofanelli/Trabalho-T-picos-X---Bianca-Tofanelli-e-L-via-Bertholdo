import { useState, useEffect } from 'react';

export default function StudentDashboard({ onStartQuiz }) {
  const [dashboard, setDashboard] = useState({ available: [], completed: [], missed: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const userId = localStorage.getItem('userId');

  useEffect(() => {
    const buscarProvas = async () => {
      try {
        // 👇 Chamando a nova rota inteligente passando o ID do aluno logado 👇
        const response = await fetch(`/api/quizzes/dashboard/aluno/${userId}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });

        if (!response.ok) throw new Error('Falha ao carregar as informações do painel.');

        const data = await response.json();
        setDashboard(data); // Preenche as listas 'available' e 'completed' de uma vez!
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (userId) buscarProvas();
  }, [userId]);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold text-gray-900">Meu Painel</h1>

      {loading && <p className="text-blue-600 font-medium">Carregando painel...</p>}
      {error && <p className="text-red-600 bg-red-50 p-3 rounded-lg border">{error}</p>}

      {/* Seção 1: Provas Disponíveis */}
      <section>
        <h2 className="text-xl font-bold text-green-700 border-b-2 border-green-100 pb-2 mb-4">
          Provas Disponíveis
        </h2>
        
        {!loading && dashboard.available.length === 0 && (
          <p className="text-gray-500 bg-gray-50 p-4 rounded-lg border border-gray-100">
            Nenhuma prova pendente no momento. Ótimo trabalho!
          </p>
        )}
        
        <div className="grid gap-4">
          {dashboard.available.map(quiz => (
            <div key={quiz.id} className="p-5 bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-md transition-shadow">
              <div>
                <h3 className="font-bold text-lg text-gray-900">{quiz.title}</h3>
                <p className="text-sm text-gray-600 mt-1">Duração: <strong>{quiz.duration} minutos</strong></p>
              </div>
              <button 
                onClick={() => onStartQuiz(quiz.id)}
                className="w-full md:w-auto bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors"
              >
                Iniciar Prova
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Seção 2: Provas Concluídas */}
      <section>
        <h2 className="text-xl font-bold text-blue-700 border-b-2 border-blue-100 pb-2 mb-4">
          Provas Concluídas
        </h2>
        
        {!loading && dashboard.completed.length === 0 && (
          <p className="text-gray-500 text-sm bg-gray-50 p-4 rounded-lg border border-gray-100">
            Você ainda não concluiu nenhuma avaliação.
          </p>
        )}

        <div className="grid gap-4">
          {dashboard.completed.map(quiz => (
            <div key={quiz.id} className="p-5 bg-gray-50 border border-gray-200 rounded-xl flex justify-between items-center opacity-85 shadow-sm">
              <div>
                <h3 className="font-bold text-lg text-gray-700 line-through">{quiz.title}</h3>
                <p className="text-sm text-green-600 font-semibold mt-1">✓ Status: Enviada para correção</p>
              </div>
              <span className="bg-green-100 text-green-800 px-4 py-2 rounded-lg font-bold text-sm">
                Realizada
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Seção 3: Provas Perdidas */}
      <section className="opacity-60">
        <h2 className="text-xl font-bold text-red-700 border-b-2 border-red-100 pb-2 mb-4">
          Provas Perdidas (Prazo Encerrado)
        </h2>
        <p className="text-gray-500 text-sm">Nenhuma prova perdida.</p>
      </section>
    </div>
  );
}