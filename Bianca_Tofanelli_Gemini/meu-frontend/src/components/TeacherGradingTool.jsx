import { useState, useEffect } from 'react';
import API_URL from '../apiConfig';

export default function TeacherGradingTool({ submissionId, onBack }) {
  const [data, setData] = useState(null);
  const [grades, setGrades] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(''); 

  useEffect(() => {
    let isMounted = true; 

    const loadSubmission = async () => {
      try {
        const res = await fetch(`${API_URL}/api/quizzes/submissions/${submissionId}/details`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        
        if (!res.ok) throw new Error('Falha ao carregar os dados da submissão.');
        
        const fetchedData = await res.json();
        if (isMounted) setData(fetchedData);
        
      } catch (err) {
        console.error(err);
        if (isMounted) setError(err.message);
      }
    };

    if (submissionId) loadSubmission();

    return () => { isMounted = false; };
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
    // 👇 1. TRAVA DE SEGURANÇA (Código otimizado para não irritar o Linter) 👇
    const essayQuestions = data.questions.filter(q => q.type === 'ESSAY');
    
    for (const q of essayQuestions) {
      const details = typeof q.details === 'string' ? JSON.parse(q.details) : (q.details || {});
      const pesoMaximo = parseFloat(details.peso || 1);

      // Cria a constante diretamente com o valor final, evitando atribuições inúteis
      const notaAnalisada = (grades[q.id] && grades[q.id].score !== undefined && grades[q.id].score !== '')
        ? parseFloat(grades[q.id].score)
        : parseFloat(data.answers[q.id]?.score || 0);

      // Bloqueia notas acima do peso máximo ou negativas
      if (notaAnalisada > pesoMaximo) {
        return alert(`⚠️ AVALIAÇÃO BLOQUEADA!\n\nVocê tentou dar ${notaAnalisada.toFixed(1)} pontos em uma questão que vale no máximo ${pesoMaximo.toFixed(1)} pts.\n\nPor favor, corrija o valor e tente salvar novamente.`);
      }
      if (notaAnalisada < 0) {
        return alert(`⚠️ AVALIAÇÃO BLOQUEADA!\n\nA nota não pode ser negativa.`);
      }
    }

    // 2. Se passou na validação, prossegue com o salvamento
    setIsSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/quizzes/submissions/${submissionId}/grade`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify({ grades })
      });
      
      if (!res.ok) throw new Error('Erro ao salvar as notas.');
      
      alert('Correção finalizada com sucesso!');
      onBack();
      
    } catch (err) {
      console.error(err);
      alert('Erro de conexão ao salvar a correção. Tente novamente.');
      setIsSaving(false);
    }
  };

  if (error) return <div className="p-10 text-center text-red-600 font-bold">{error}</div>;
  if (!data) return <div className="p-10 text-center font-bold text-blue-600">Carregando submissão...</div>;

  const essayQuestions = data.questions.filter(q => q.type === 'ESSAY');

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold">Correção de Prova</h1>
          <p className="text-gray-600">Aluno: {data.aluno?.name || 'Desconhecido'} | Status: {data.status === 'GRADED' ? 'Corrigido' : 'Pendente'}</p>
        </div>
        <button onClick={onBack} className="text-blue-600 hover:underline font-medium">Voltar à lista</button>
      </div>

      {essayQuestions.length === 0 ? (
        <p className="text-green-700 font-medium bg-green-50 p-4 border border-green-200 rounded-lg">Esta prova continha apenas questões objetivas e já foi corrigida automaticamente pelo sistema.</p>
      ) : (
        <div className="space-y-8">
          {essayQuestions.map((q, index) => {
            const studentAnswer = data.answers[q.id]?.valor || "Não respondeu";
            const details = typeof q.details === 'string' ? JSON.parse(q.details) : (q.details || {});
            const rubricText = details.rubric || null;

            const savedScore = data.answers[q.id]?.score ?? '';
            const savedFeedback = data.answers[q.id]?.feedback ?? '';

            return (
              <div key={q.id} className="bg-white border rounded-xl shadow-sm overflow-hidden">
                <div className="bg-gray-50 p-4 border-b">
                  <h3 className="font-bold text-gray-800">Questão {index + 1}</h3>
                  <p className="text-gray-700 mt-2 whitespace-pre-wrap">{q.content}</p>
                  
                  {details.keywords && details.keywords.length > 0 && (
                     <div className="mt-3 text-sm text-blue-700 bg-blue-50 inline-block p-2 border border-blue-100 rounded">
                       <strong>Palavras-chave esperadas:</strong> {details.keywords.join(', ')}
                     </div>
                  )}
                </div>

                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-600 mb-2">Resposta do Aluno:</h4>
                    <div className="bg-yellow-50 p-4 rounded-lg text-gray-800 italic min-h-[120px] whitespace-pre-wrap border border-yellow-100">
                      {studentAnswer}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-600">Avaliação e Rubrica:</h4>
                    
                    {rubricText && (
                      <div className="text-sm bg-gray-100 p-3 rounded mb-4 border border-gray-200">
                        <span className="font-bold block mb-1">Critérios de Correção:</span>
                        <p className="text-gray-700 whitespace-pre-wrap">{rubricText}</p>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nota da Questão (Máx: {details.peso || 1} pts):</label>
                      <input 
                        type="text" 
                        defaultValue={savedScore} 
                        className="w-32 p-2 border rounded focus:ring-blue-500 focus:border-blue-500 outline-none font-bold"
                        placeholder="Ex: 2.5"
                        onChange={(e) => {
                          let valorSeguro = e.target.value.replace(',', '.');
                          let notaDecimal = parseFloat(valorSeguro);
                          handleGradeChange(q.id, 'score', isNaN(notaDecimal) ? '' : notaDecimal);
                        }}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Feedback Privado (Opcional):</label>
                      <textarea 
                        rows="3" 
                        defaultValue={savedFeedback} 
                        className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
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
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-bold shadow-md disabled:opacity-50 transition-colors"
            >
              {isSaving ? 'Salvando...' : 'Finalizar Correção e Publicar Nota'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}