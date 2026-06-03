// components/TeacherGradingTool.jsx
import React, { useState, useEffect } from 'react';

export default function TeacherGradingTool({ submissionId, onBack }) {
  const [data, setData] = useState(null);
  const [grades, setGrades] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Busca a submissão e as questões do quiz populadas
    fetch(`/api/submissions/${submissionId}/details`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => res.json())
      .then(fetchedData => setData(fetchedData));
  }, [submissionId]);

  const handleGradeChange = (questionId, field, value) => {
    setGrades(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        [field]: value
      }
    }));
  };

  const handleSaveGrades = async () => {
    setIsSaving(true);
    await fetch(`/api/submissions/${submissionId}/grade`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}` 
      },
      body: JSON.stringify({ grades })
    });
    alert('Correção finalizada!');
    onBack();
  };

  if (!data) return <div className="p-10 text-center">Carregando submissão...</div>;

  const essayQuestions = data.questions.filter(q => q.type === 'ESSAY');

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold">Correção de Prova</h1>
          <p className="text-gray-600">Aluno: {data.aluno.name} | Status: {data.score !== null ? 'Corrigido' : 'Pendente'}</p>
        </div>
        <button onClick={onBack} className="text-blue-600 hover:underline">Voltar à lista</button>
      </div>

      {essayQuestions.length === 0 ? (
        <p className="text-green-600 font-medium bg-green-50 p-4 rounded-lg">Esta prova continha apenas questões objetivas e já foi corrigida automaticamente pelo sistema.</p>
      ) : (
        <div className="space-y-8">
          {essayQuestions.map((q, index) => {
            const studentAnswer = data.answers[q.id]?.providedAnswer || "Não respondeu";
            const details = JSON.parse(q.details);
            const rubricCriteria = q.rubric ? JSON.parse(q.rubric.criteria) : null;

            return (
              <div key={q.id} className="bg-white border rounded-xl shadow-sm overflow-hidden">
                <div className="bg-gray-50 p-4 border-b">
                  <h3 className="font-bold text-gray-800">Questão {index + 1}</h3>
                  <p className="text-gray-700 mt-2">{q.content}</p>
                  
                  {details.keywords && details.keywords.length > 0 && (
                     <div className="mt-3 text-sm text-blue-700 bg-blue-50 inline-block p-2 rounded">
                        <strong>Palavras-chave esperadas:</strong> {details.keywords.join(', ')}
                     </div>
                  )}
                </div>

                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Lado Esquerdo: Resposta do Aluno */}
                  <div>
                    <h4 className="font-semibold text-gray-600 mb-2">Resposta do Aluno:</h4>
                    <div className="bg-yellow-50 p-4 rounded-lg text-gray-800 italic min-h-[120px] whitespace-pre-wrap border border-yellow-100">
                      {studentAnswer}
                    </div>
                  </div>

                  {/* Lado Direito: Ferramenta de Avaliação */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-600">Avaliação e Rubrica:</h4>
                    
                    {rubricCriteria && (
                      <div className="text-sm bg-gray-100 p-3 rounded mb-4">
                        <span className="font-bold block mb-1">Critérios de Correção:</span>
                        <ul className="list-disc pl-5">
                          {/* Exemplo de renderização do JSON da rubrica */}
                          {typeof rubricCriteria === 'string' ? rubricCriteria : 'Consulte a rubrica anexada para os pesos e critérios.'}
                        </ul>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nota da Questão:</label>
                      <input 
                        type="number" 
                        min="0"
                        step="0.1"
                        className="w-32 p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Ex: 2.5"
                        onChange={(e) => handleGradeChange(q.id, 'score', parseFloat(e.target.value))}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Feedback Privado (Opcional):</label>
                      <textarea 
                        rows="3" 
                        className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Escreva um comentário sobre o desempenho nesta questão..."
                        onChange={(e) => handleGradeChange(q.id, 'feedback', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          
          <div className="flex justify-end pt-4">
            <button 
              onClick={handleSaveGrades}
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-bold shadow-md disabled:opacity-50"
            >
              {isSaving ? 'Salvando...' : 'Finalizar Correção e Publicar Nota'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}