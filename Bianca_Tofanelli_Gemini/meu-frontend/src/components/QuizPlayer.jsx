import { useState, useEffect } from 'react';

export default function QuizPlayer({ quizId, onFinish }) {
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [respostas, setRespostas] = useState({}); // Guarda o que o aluno respondeu

  useEffect(() => {
    const carregarProva = async () => {
      try {
        const response = await fetch(`/api/quizzes/${quizId}`);
        if (response.ok) {
          const data = await response.json();
          setQuiz(data);
        }
      } catch (error) {
        console.error("Erro ao carregar a prova", error);
      } finally {
        setLoading(false);
      }
    };

    carregarProva();
  }, [quizId]);

  const handleSalvarResposta = (questionId, valor) => {
    setRespostas({ ...respostas, [questionId]: valor });
  };

  if (loading) {
    return <div className="p-10 text-center text-lg text-blue-600 font-bold">Carregando a prova...</div>;
  }

  if (!quiz || !quiz.questions || quiz.questions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow mt-8 text-center text-gray-500">
        Esta prova não possui questões cadastradas.
        <button onClick={onFinish} className="block mx-auto mt-4 bg-gray-600 text-white px-4 py-2 rounded">Voltar</button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-2xl shadow-sm border border-gray-200 mt-8 space-y-8">
      {/* Cabeçalho da Prova */}
      <div className="border-b border-gray-100 pb-4 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">{quiz.title}</h2>
        <span className="bg-blue-50 text-blue-700 px-4 py-1 rounded-full text-sm font-bold">
          Duração: {quiz.duration} min
        </span>
      </div>

      {/* Listagem de Perguntas Reais */}
      <div className="space-y-6">
        {quiz.questions.map((q, index) => (
          <div key={q.id} className="p-5 bg-gray-50 rounded-xl border border-gray-100">
            <p className="font-bold text-gray-800 mb-3">Questão {index + 1}</p>
            <p className="text-gray-700 mb-4 whitespace-pre-wrap">{q.content}</p>

            {/* Renderização conforme o Tipo de Questão */}
            {q.type === 'MULTIPLE_CHOICE' && (
              <div className="space-y-2">
                {q.details.options.map((opcao, i) => (
                  <label key={i} className="flex items-center space-x-3 p-2 bg-white rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors">
                    <input 
                      type="radio" 
                      name={`question-${q.id}`} 
                      checked={respostas[q.id] === i}
                      onChange={() => handleSalvarResposta(q.id, i)}
                    />
                    <span className="text-gray-700">{opcao}</span>
                  </label>
                ))}
              </div>
            )}

            {q.type === 'TRUE_FALSE' && (
              <div className="flex gap-4">
                <button 
                  onClick={() => handleSalvarResposta(q.id, true)}
                  className={`flex-1 py-2 rounded-lg font-bold border transition-colors ${respostas[q.id] === true ? 'bg-green-100 border-green-500 text-green-700' : 'bg-white border-gray-200'}`}
                >
                  Verdadeiro
                </button>
                <button 
                  onClick={() => handleSalvarResposta(q.id, false)}
                  className={`flex-1 py-2 rounded-lg font-bold border transition-colors ${respostas[q.id] === false ? 'bg-red-100 border-red-500 text-red-700' : 'bg-white border-gray-200'}`}
                >
                  Falso
                </button>
              </div>
            )}

            {q.type === 'ESSAY' && (
              <textarea 
                className="w-full p-3 bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-100"
                rows="4"
                placeholder="Digite a sua resposta dissertativa aqui..."
                value={respostas[q.id] || ''}
                onChange={(e) => handleSalvarResposta(q.id, e.target.value)}
              />
            )}
          </div>
        ))}
      </div>

      {/* Botão de Finalizar */}
      <button 
        onClick={() => {
          console.log("Respostas enviadas pelo aluno:", respostas);
          alert("Prova entregue com sucesso!");
          onFinish();
        }}
        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition-colors shadow-md"
      >
        Submeter / Entregar Prova
      </button>
    </div>
  );
}