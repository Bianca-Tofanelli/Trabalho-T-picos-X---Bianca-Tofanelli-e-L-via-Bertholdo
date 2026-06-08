import { useState, useEffect } from 'react';
import API_URL from '../apiConfig'; // 👈 Importamos o endereço da nuvem!

export default function QuizPlayer({ quizId, onFinish }) {
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [respostas, setRespostas] = useState({}); 
  const [tempoRestante, setTempoRestante] = useState(0); 

  const entregarProva = async () => {
    try {
      const studentId = localStorage.getItem('userId');

      // 👇 CORREÇÃO 1: Adicionamos o API_URL na hora de submeter a prova 👇
      const response = await fetch(`${API_URL}/api/quizzes/${quizId}/submeter`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          studentId: studentId,
          answers: respostas 
        })
      });

      if (!response.ok) throw new Error('Erro ao registrar respostas.');

      alert("🎉 Prova concluída e enviada com sucesso!");
      onFinish(); 

    } catch (error) {
      console.error(error);
      alert("Erro de conexão ao tentar entregar a prova.");
    }
  };

  useEffect(() => {
    const carregarProva = async () => {
      try {
        // 👇 CORREÇÃO 2: Adicionamos o API_URL na hora de carregar as questões 👇
        const response = await fetch(`${API_URL}/api/quizzes/${quizId}`);
        if (response.ok) {
          const data = await response.json();
          setQuiz(data);
          
          const duracaoEmSegundos = data.duration * 60;
          let tempoFinal = duracaoEmSegundos;

          if (data.endDate) {
            const dataFim = new Date(data.endDate).getTime();
            const agora = new Date().getTime();
            const segundosAteFimDaProva = Math.floor((dataFim - agora) / 1000);

            if (segundosAteFimDaProva > 0) {
              tempoFinal = Math.min(duracaoEmSegundos, segundosAteFimDaProva);
            } else {
              tempoFinal = 0; 
            }
          }

          setTempoRestante(tempoFinal); 
        }
      } catch (error) {
        console.error("Erro ao carregar a prova", error);
      } finally {
        setLoading(false);
      }
    };

    carregarProva();
  }, [quizId]);

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
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tempoRestante, loading, quiz]);

  const handleSalvarResposta = (questionId, valor) => {
    setRespostas({ ...respostas, [questionId]: valor });
  };

  // 👇 FUNÇÃO MANTIDA: Apaga a resposta do aluno e deixa a questão em branco 👇
  const handleLimparResposta = (questionId) => {
    const novasRespostas = { ...respostas };
    delete novasRespostas[questionId]; // Remove a marcação da memória
    setRespostas(novasRespostas);
  };

  const formatarTempo = (segundosTotais) => {
    const horas = Math.floor(segundosTotais / 3600);
    const minutos = Math.floor((segundosTotais % 3600) / 60);
    const segundos = segundosTotais % 60;
    
    const minsFormatados = String(minutos).padStart(2, '0');
    const segsFormatados = String(segundos).padStart(2, '0');
    
    if (horas > 0) {
      return `${String(horas).padStart(2, '0')}:${minsFormatados}:${segsFormatados}`;
    }
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

      <div className="space-y-6">
        {quiz.questions.map((q, index) => {
          // Verifica se o aluno já respondeu esta questão
          const temResposta = respostas[q.id] !== undefined && respostas[q.id] !== '';

          return (
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

              {/* 👇 BOTÃO DE LIMPAR MARCAÇÃO 👇 */}
              {temResposta && (
                <div className="mt-4 pt-3 border-t border-gray-200 text-right">
                  <button
                    onClick={() => handleLimparResposta(q.id)}
                    className="text-sm font-bold text-gray-400 hover:text-red-500 transition-colors flex items-center justify-end w-full gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Limpar marcação
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button 
        onClick={entregarProva}
        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition-colors shadow-md mt-8"
      >
        Submeter / Entregar Prova
      </button>
    </div>
  );
}