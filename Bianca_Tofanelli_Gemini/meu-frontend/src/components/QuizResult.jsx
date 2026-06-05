import { useState, useEffect } from 'react';

export default function QuizResult({ quizId, onBack }) {
  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const studentId = localStorage.getItem('userId');

  useEffect(() => {
    const buscarResultado = async () => {
      try {
        const response = await fetch(`/api/quizzes/${quizId}/resultado/${studentId}`);
        if (!response.ok) throw new Error('Não foi possível carregar o resultado.');
        setResultado(await response.json());
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    buscarResultado();
  }, [quizId, studentId]);

  if (loading) return <div className="p-10 text-center font-bold text-blue-600">Buscando gabaritos...</div>;
  if (error) return <div className="p-10 text-center font-bold text-red-600">{error}</div>;

  const { prova, entrega } = resultado;

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-2xl shadow-sm border border-gray-200 mt-8">
      <div className="border-b border-gray-200 pb-4 flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Resultado: {prova.title}</h2>
          <p className="text-gray-500 mt-1">Status: {entrega.status === 'GRADED' ? 'Corrigida' : 'Aguardando Professor'}</p>
        </div>
        <div className="bg-blue-50 text-blue-800 px-6 py-3 rounded-xl border border-blue-200 text-center">
          <span className="block text-sm font-bold uppercase">Nota Final</span>
          <span className="text-3xl font-black">{entrega.nota !== null ? entrega.nota : '--'}</span>
        </div>
      </div>

      <div className="space-y-6">
        {prova.questions.map((q, index) => {
          const respostaAluno = entrega.respostas[q.id];
          const acertou = respostaAluno?.isCorrect;

          return (
            <div key={q.id} className={`p-5 rounded-xl border-2 ${acertou === true ? 'border-green-300 bg-green-50' : acertou === false ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'}`}>
              <p className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                Questão {index + 1}
                {acertou === true && <span className="text-green-600">✅ Acertou</span>}
                {acertou === false && <span className="text-red-600">❌ Errou</span>}
              </p>
              
              <p className="text-gray-700 mb-4 whitespace-pre-wrap">{q.content}</p>

              <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-2">
                <p className="text-sm text-gray-500 font-bold uppercase">Sua Resposta:</p>
                <p className={`font-medium ${acertou === false ? 'text-red-600' : 'text-gray-800'}`}>
                  {q.type === 'MULTIPLE_CHOICE' ? q.details.options[respostaAluno?.valor] : 
                   q.type === 'TRUE_FALSE' ? (respostaAluno?.valor ? 'Verdadeiro' : 'Falso') : 
                   respostaAluno?.valor}
                </p>

                {/* Exibe o gabarito oficial se o aluno tiver errado ou se for dissertativa */}
                {(acertou === false || q.type === 'ESSAY') && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-sm text-green-700 font-bold uppercase mb-1">
                      {q.type === 'ESSAY' ? 'Rubrica/Gabarito Esperado:' : 'Resposta Correta:'}
                    </p>
                    <p className="font-medium text-green-800">
                      {q.type === 'MULTIPLE_CHOICE' ? q.details.options[q.details.correctOptionIndex] : 
                       q.type === 'TRUE_FALSE' ? (q.details.correctAnswer ? 'Verdadeiro' : 'Falso') : 
                       q.details.rubric}
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <button onClick={onBack} className="mt-8 w-full bg-gray-800 text-white font-bold py-3 rounded-xl">
        Voltar para o Painel
      </button>
    </div>
  );
}