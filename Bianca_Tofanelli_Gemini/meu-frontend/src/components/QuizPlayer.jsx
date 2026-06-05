import { useState, useEffect } from 'react';

export default function QuizPlayer({ quizId, onFinish }) {
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [respostas, setRespostas] = useState({}); 
  const [tempoRestante, setTempoRestante] = useState(0); 

  // 👇 1. A SOLUÇÃO: A função foi movida para o topo, antes de ser usada! 👇
  const entregarProva = () => {
    console.log("Respostas enviadas pelo aluno:", respostas);
    alert("Prova entregue com sucesso!");
    onFinish();
  };

  useEffect(() => {
    const carregarProva = async () => {
      try {
        const response = await fetch(`/api/quizzes/${quizId}`);
        if (response.ok) {
          const data = await response.json();
          setQuiz(data);
          setTempoRestante(data.duration * 60); 
        }
      } catch (error) {
        console.error("Erro ao carregar a prova", error);
      } finally {
        setLoading(false);
      }
    };

    carregarProva();
  }, [quizId]);

  // 👇 2. O MOTOR DO CRONÔMETRO REGRESSIVO 👇
  useEffect(() => {
    if (loading || !quiz) return;

    if (tempoRestante <= 0) {
      alert("⏱️ O tempo limite acabou! Sua prova foi finalizada e enviada automaticamente.");
      entregarProva();
      return;
    }

    const intervalo = setInterval(() => {
      setTempoRestante((tempo) => tempo - 1);
    }, 1000);

    return () => clearInterval(intervalo);
    
    // 👇 O FEITIÇO: Avisa o React para ignorar o alerta da dependência e não travar o relógio
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tempoRestante, loading, quiz]);

  const handleSalvarResposta = (questionId, valor) => {
    setRespostas({ ...respostas, [questionId]: valor });
  };

  const formatarTempo = (segundosTotais) => {
    const minutos = Math.floor(segundosTotais / 60);
    const segundos = segundosTotais % 60;
    const minsFormatados = String(minutos).padStart(2, '0');
    const segsFormatados = String(segundos).padStart(2, '0');
    return `${minsFormatados}:${segsFormatados}`;
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
      
      {/* Cabeçalho da Prova com Cronômetro Dinâmico */}
      <div className="border-b border-gray-100 pb-4 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">{quiz.title}</h2>
        
        <span className={`px-4 py-2 rounded-xl text-base font-bold shadow-sm transition-all duration-300 ${
          tempoRestante < 60 
            ? 'bg-red-100 text-red-700 animate-pulse border border-red-200' 
            : 'bg-blue-50 text-blue-700 border border-blue-100'
        }`}>
          ⏱️ Tempo restante: {formatarTempo(tempoRestante)}
        </span>
      </div>

      {/* Listagem de Perguntas */}
      <div className="space-y-6">
        {quiz.questions.map((q, index) => (
          <div key={q.id} className="p-5 bg-gray-50 rounded-xl border border-gray-100">
            <p className="font-bold text-gray-800 mb-3">Questão {index + 1}</p>
            <p className="text-gray-700 mb-4 whitespace-pre-wrap">{q.content}</p>

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

      <button 
        onClick={entregarProva}
        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition-colors shadow-md"
      >
        Submeter / Entregar Prova
      </button>
    </div>
  );
}