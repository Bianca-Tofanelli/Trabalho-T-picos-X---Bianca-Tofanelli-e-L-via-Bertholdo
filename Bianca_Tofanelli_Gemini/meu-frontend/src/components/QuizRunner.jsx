import { useState, useEffect, useRef, useCallback } from 'react';
import API_URL from '../apiConfig'; 

export default function QuizRunner({ quizId, onFinish }) {
  const [quizData, setQuizData] = useState(null);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const timerRef = useRef(null);
  const answersRef = useRef({}); 
  
  // Uma memória segura para o botão de enviar não ser clicado duas vezes
  const isSubmittingRef = useRef(false);

  // 👇 1. A função de envio foi movida para cima e isolada com useCallback
  const handleSubmit = useCallback(async (isAutoSubmit = false) => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    
    if (!isAutoSubmit && !confirm('Tem certeza que deseja enviar a prova? Não será possível alterar as respostas.')) {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
      return;
    }

    clearInterval(timerRef.current);

    try {
      await fetch(`${API_URL}/api/student/quizzes/${quizId}/submit`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify({ answers: answersRef.current }) 
      });

      alert(isAutoSubmit ? 'O tempo esgotou! Suas respostas foram enviadas automaticamente.' : 'Prova enviada com sucesso!');
      onFinish();
    } catch (error) {
      console.error(error);
      alert('Erro ao enviar a prova. Tente novamente.');
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  }, [quizId, onFinish]);

  // 👇 2. O cronômetro movido para cima e blindado
  const startTimer = useCallback((startedAtIso, durationMinutes) => {
    const startTime = new Date(startedAtIso).getTime();
    const endTime = startTime + (durationMinutes * 60000);

    timerRef.current = setInterval(() => {
      const now = new Date().getTime();
      const difference = endTime - now;

      if (difference <= 0) {
        clearInterval(timerRef.current);
        setTimeLeft(0);
        handleSubmit(true); 
      } else {
        setTimeLeft(Math.floor(difference / 1000));
      }
    }, 1000);
  }, [handleSubmit]);

  // 👇 3. O useEffect agora conhece todas as funções e obedece ao linter
  useEffect(() => {
    const initQuiz = async () => {
      try {
        const res = await fetch(`${API_URL}/api/student/quizzes/${quizId}/start`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await res.json();
        
        if (res.ok) {
          setQuizData(data);
          startTimer(data.startedAt, data.duration);
        } else {
          alert(data.error || 'Erro ao iniciar a prova.');
          onFinish();
        }
      } catch (error) {
        console.error(error);
        alert('Erro de conexão ao iniciar a prova.');
      }
    };
    initQuiz();

    return () => clearInterval(timerRef.current);
  }, [quizId, onFinish, startTimer]);

  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => {
      const novasRespostas = { ...prev, [questionId]: value };
      answersRef.current = novasRespostas; 
      return novasRespostas;
    });
  };

  if (!quizData) return <div className="p-10 text-center font-bold text-blue-600">Carregando a prova e preparando relógio seguro...</div>;

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      <div className="sticky top-0 bg-white shadow-md p-4 flex justify-between items-center z-50">
        <h2 className="text-xl font-bold text-gray-800">Realizando Prova</h2>
        <div className={`text-2xl font-mono font-bold px-4 py-1 rounded-lg ${timeLeft < 60 ? 'bg-red-100 text-red-700 animate-pulse border border-red-200' : 'text-gray-800'}`}>
          Tempo Restante: {timeLeft !== null ? formatTime(timeLeft) : '--:--'}
        </div>
      </div>

      <div className="max-w-3xl mx-auto mt-8 space-y-8 px-4">
        {quizData.questions.map((q, index) => (
          <div key={q.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="font-semibold text-lg mb-4 text-gray-800">{index + 1}. {q.content}</h3>

            {q.type === 'MULTIPLE_CHOICE' && (
              <div className="space-y-3">
                {q.details.options.map((opt, i) => (
                  <label key={i} className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${answers[q.id] === i ? 'bg-blue-50 border-blue-400' : 'hover:bg-gray-50'}`}>
                    <input 
                      type="radio" 
                      name={`q-${q.id}`} 
                      checked={answers[q.id] === i}
                      onChange={() => handleAnswerChange(q.id, i)}
                      className="w-5 h-5 text-blue-600"
                    />
                    <span className="text-gray-700">{opt}</span>
                  </label>
                ))}
              </div>
            )}

            {q.type === 'TRUE_FALSE' && (
              <div className="flex gap-4">
                <button 
                  onClick={() => handleAnswerChange(q.id, true)}
                  className={`flex-1 py-3 rounded-lg font-bold border transition-colors ${answers[q.id] === true ? 'bg-blue-100 border-blue-500 text-blue-800' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                >
                  Verdadeiro
                </button>
                <button 
                  onClick={() => handleAnswerChange(q.id, false)}
                  className={`flex-1 py-3 rounded-lg font-bold border transition-colors ${answers[q.id] === false ? 'bg-blue-100 border-blue-500 text-blue-800' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                >
                  Falso
                </button>
              </div>
            )}

            {q.type === 'ESSAY' && (
              <textarea 
                className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-gray-700" 
                rows="4" 
                placeholder="Digite sua resposta aqui..."
                value={answers[q.id] || ''}
                onChange={(e) => handleAnswerChange(q.id, e.target.value)}
              />
            )}
          </div>
        ))}

        <div className="flex justify-end mt-8">
          <button 
            onClick={() => handleSubmit(false)}
            disabled={isSubmitting}
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl font-bold text-lg shadow-md disabled:opacity-50 transition-colors w-full md:w-auto"
          >
            {isSubmitting ? 'Enviando ao servidor...' : 'Finalizar e Enviar Prova'}
          </button>
        </div>
      </div>
    </div>
  );
}