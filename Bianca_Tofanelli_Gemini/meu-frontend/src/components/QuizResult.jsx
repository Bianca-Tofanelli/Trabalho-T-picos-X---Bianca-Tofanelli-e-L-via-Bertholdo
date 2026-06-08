import { useState, useEffect } from 'react';
import API_URL from '../apiConfig';

export default function QuizResult({ quizId, onBack }) {
  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const studentId = localStorage.getItem('userId');

  useEffect(() => {
    const buscarResultado = async () => {
      try {
        const response = await fetch(`${API_URL}/api/quizzes/${quizId}/resultado/${studentId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!response.ok) throw new Error('Não foi possível carregar o resultado.');
        setResultado(await response.json());
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    if (quizId && studentId) {
      buscarResultado();
    }
  }, [quizId, studentId]);

  if (loading) return <div className="p-10 text-center font-bold text-blue-600">Buscando gabaritos...</div>;
  if (error) return <div className="p-10 text-center font-bold text-red-600">{error}</div>;

  const { prova, entrega } = resultado;
  const isPendente = entrega.status === 'PENDING_REVIEW';
  
  const notaFinalSegura = entrega.nota !== null ? parseFloat(String(entrega.nota).replace(',', '.')) : 0;

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-2xl shadow-sm border border-gray-200 mt-8">
      
      <div className="border-b border-gray-200 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Resultado: {prova.title}</h2>
          <p className="text-gray-500 mt-1">Status: {isPendente ? 'Aguardando Professor' : 'Corrigida'}</p>
        </div>
        
        <div className={`px-6 py-3 rounded-xl border text-center min-w-[150px] ${isPendente ? 'bg-yellow-50 border-yellow-200 text-yellow-800' : 'bg-blue-50 border-blue-200 text-blue-800'}`}>
          <span className="block text-sm font-bold uppercase">
            {isPendente ? 'Nota Parcial' : 'Nota Final'}
          </span>
          <span className="text-3xl font-black flex items-baseline justify-center gap-1 mt-1">
            {entrega.nota !== null ? notaFinalSegura.toFixed(1) : '0.0'} 
            {isPendente ? ' + ?' : <span className="text-xl text-blue-600 font-bold"> / 10.0</span>}
          </span>
          {isPendente && (
            <span className="block text-xs mt-1 font-medium text-yellow-700">
              *Aguardando dissertativa
            </span>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {prova.questions.map((q, index) => {
          const respostaAluno = entrega.respostas[q.id] || {};
          const acertou = respostaAluno?.isCorrect;
          const pesoQuestao = parseFloat(q.details.peso || 1).toFixed(1);
          
          const isDissertativa = q.type === 'ESSAY';
          const feedbackProfessor = respostaAluno?.feedback;
          
          // 👇 RADAR DE NOTAS: Procura em todos os possíveis nomes que o backend pode ter usado 👇
          let rawScore = respostaAluno?.score ?? respostaAluno?.nota ?? respostaAluno?.grade ?? respostaAluno?.pontuacao;
          
          const valorSeguro = rawScore !== undefined && rawScore !== null ? String(rawScore).replace(',', '.') : null;
          
          const foiCorrigida = !isPendente || valorSeguro !== null;
          let notaProfessor = valorSeguro !== null ? parseFloat(valorSeguro) : 0;
          if (isNaN(notaProfessor)) notaProfessor = 0; 

          const emBranco = (respostaAluno.valor === undefined || respostaAluno.valor === null || String(respostaAluno.valor).trim() === "") && notaProfessor === 0;

          return (
            <div key={q.id} className={`p-5 rounded-xl border-2 ${
              (acertou === true || (isDissertativa && foiCorrigida && notaProfessor > 0)) 
                ? 'border-green-300 bg-green-50' 
                : emBranco 
                  ? 'border-gray-300 bg-gray-50' 
                  : (isDissertativa && !foiCorrigida) 
                    ? 'border-yellow-300 bg-yellow-50' 
                    : 'border-red-300 bg-red-50'
            }`}>
              <p className="font-bold text-gray-800 mb-3 flex items-center flex-wrap gap-2">
                Questão {index + 1} 
                <span className="text-gray-500 font-normal text-sm">(Vale {pesoQuestao} pts)</span>
                
                {!isDissertativa && acertou === true && <span className="text-green-600 ml-auto">✅ Acertou</span>}
                {!isDissertativa && acertou === false && !emBranco && <span className="text-red-600 ml-auto">❌ Errou</span>}
                
                {isDissertativa && foiCorrigida && (
                  <span className={`font-bold ml-auto px-3 py-1 rounded-full text-sm ${notaProfessor > 0 ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                    Nota: {notaProfessor.toFixed(1)} / {pesoQuestao} pts
                  </span>
                )}
                {isDissertativa && !foiCorrigida && !emBranco && (
                  <span className="text-yellow-700 font-bold ml-auto bg-yellow-100 px-3 py-1 rounded-full text-sm">
                    ⏳ Aguardando Correção
                  </span>
                )}

                {emBranco && <span className="text-gray-500 font-bold ml-auto">⚪ Deixou em branco (0 pts)</span>}
              </p>
              
              <p className="text-gray-700 mb-4 whitespace-pre-wrap">{q.content}</p>

              <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-2">
                <p className="text-sm text-gray-500 font-bold uppercase">Sua Resposta:</p>
                <p className={`font-medium ${emBranco ? 'text-gray-500 italic' : (!isDissertativa && acertou === false ? 'text-red-600' : 'text-gray-800')}`}>
                  {emBranco ? 'Você não respondeu esta questão.' : 
                   (q.type === 'MULTIPLE_CHOICE' ? q.details.options[respostaAluno?.valor] : 
                    q.type === 'TRUE_FALSE' ? (respostaAluno?.valor ? 'Verdadeiro' : 'Falso') : 
                    respostaAluno?.valor)}
                </p>

                {(acertou === false || emBranco || q.type === 'ESSAY') && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-sm text-green-700 font-bold uppercase mb-1">
                      {q.type === 'ESSAY' ? 'Critérios de Avaliação do Professor:' : 'Resposta Correta:'}
                    </p>
                    <p className="font-medium text-green-800 whitespace-pre-wrap">
                      {q.type === 'MULTIPLE_CHOICE' ? q.details.options[q.details.correctOptionIndex] : 
                       q.type === 'TRUE_FALSE' ? (q.details.correctAnswer ? 'Verdadeiro' : 'Falso') : 
                       q.details.rubric}
                    </p>
                  </div>
                )}

                {q.type !== 'ESSAY' && q.details.rubric && q.details.rubric.trim() !== '' && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                      <p className="text-xs text-blue-700 font-bold uppercase mb-1 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        Justificativa da Resposta:
                      </p>
                      <p className="text-sm text-blue-900 font-medium whitespace-pre-wrap">
                        {q.details.rubric}
                      </p>
                    </div>
                  </div>
                )}

                {isDissertativa && feedbackProfessor && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="bg-purple-50 border border-purple-100 rounded-lg p-3">
                      <p className="text-xs text-purple-700 font-bold uppercase mb-1 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                        </svg>
                        Comentário do Professor sobre sua resposta:
                      </p>
                      <p className="text-sm text-purple-900 font-medium whitespace-pre-wrap">
                        {feedbackProfessor}
                      </p>
                    </div>
                  </div>
                )}

              </div>
            </div>
          );
        })}
      </div>

      <button onClick={onBack} className="mt-8 w-full bg-gray-800 hover:bg-gray-900 text-white font-bold py-3 rounded-xl transition-colors">
        Voltar para o Painel
      </button>
    </div>
  );
}