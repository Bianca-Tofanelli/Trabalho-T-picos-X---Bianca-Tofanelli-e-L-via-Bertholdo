// frontend/src/components/TeacherDashboard.jsx
import React, { useState, useEffect } from 'react';

export default function TeacherDashboard() {
  // Estado para guardar a lista de provas que o professor aplicou
  const [quizzes, setQuizzes] = useState([]);

  useEffect(() => {
    // Aqui você faria um fetch para buscar as provas criadas pelo professor logado
    // Exemplo: fetch('/api/quizzes/me') ...
  }, []);

  // --- AQUI VAI A FUNÇÃO DO DOWNLOAD ---
  const handleDownloadCSV = async (quizId) => {
    try {
      const response = await fetch(`/api/reports/quizzes/${quizId}/export`, {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}` 
        }
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
  // -------------------------------------

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Painel de Relatórios da Turma</h1>
      
      {/* Exemplo de listagem de provas do professor */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold mb-4">Prova de Biologia - 1º Bimestre</h2>
        <p className="text-gray-600 mb-4">50 alunos responderam.</p>
        
        {/* O BOTÃO QUE ACIONA O DOWNLOAD */}
        <button 
          onClick={() => handleDownloadCSV('id-do-quiz-aqui')}
          className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg flex items-center shadow-md transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Baixar Relatório (CSV)
        </button>
      </div>
    </div>
  );
}