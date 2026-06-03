// components/QuizRunner.jsx
import React, { useState, useEffect, useRef } from 'react';

export default function QuizRunner({ quizId, onFinish }) {
  const [quizData, setQuizData] = useState(null);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const timerRef = useRef(null);

  useEffect(() => {
    const initQuiz = async () => {
      const res = await fetch(`/api/student/quizzes/${quizId}/start`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      
      if (res.ok) {
        setQuizData(data);
        startTimer(data.startedAt, data.duration);
      } else {
        alert(data.error);
        onFinish();
      }
    };
    initQuiz();

    return () => clearInterval(timerRef.current);
  }, [quizId]);

  const startTimer = (startedAtIso, durationMinutes) => {
    const startTime = new Date(startedAtIso).getTime();
    const endTime = startTime + (durationMinutes * 60000);

    timerRef.current = setInterval(() => {
      const now = new Date().getTime();
      const difference = endTime - now;

      if (difference <= 0) {
        clearInterval(timerRef.current);
        setTimeLeft(0);
        handleSubmit(true); // Força o envio quando o tempo zera
      } else {
        setTimeLeft(Math.floor(difference / 1000));
      }
    }, 1000);
  };

  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async (isAutoSubmit = false) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    if (!isAutoSubmit && !confirm('Tem certeza que deseja enviar a prova? Não será possível alterar as respostas.')) {
      setIsSubmitting(false);
      return;
    }

    clearInterval(timerRef.current);

    await fetch(`/api/student/quizzes/${quizId}/submit`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}` 
      },
      body: JSON.stringify({ answers })
    });

    alert(isAutoSubmit ? 'O tempo esgotou! Suas respostas foram enviadas automaticamente.' : 'Prova enviada com sucesso!');
    onFinish();
  };

  if (!quizData) return <div className="p-10 text-center">Carregando a prova e preparando relógio seguro...</div>;

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      {/* Header Fixo com o Cronômetro */}
      <div className="sticky top-0 bg-white shadow-md p-4 flex justify-between items-center z-50">
        <h2 className="text-xl font-bold text-gray-800">Realizando Prova</h2>
        <div className={`text-2xl font-mono font-bold ${timeLeft < 60 ? 'text-red-600 animate-pulse' : 'text-gray-800'}`}>
          Tempo Restante: {timeLeft !== null ? formatTime(timeLeft) : '--:--'}
        </div>
      </div>

      <div className="max-w-3xl mx-auto mt-8 space-y-8 px-4">
        {quizData.questions.map((q, index) => (
          <div key={q.id} className="bg-white p-6 rounded-xl shadow-sm border">
            <h3 className="font-semibold text-lg mb-4">{index + 1}. {q.content}</h3>

            {q.type === 'MULTIPLE_CHOICE' && (
              <div className="space-y-3">
                {q.details.options.map((opt, i) => (
                  <label key={i} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input 
                      type="radio" 
                      name={`q-${q.id}`} 
                      checked={answers[q.id] === i}
                      onChange={() => handleAnswerChange(q.id, i)}
                      className="w-5 h-5 text-blue-600"
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            )}

            {q.type === 'ESSAY' && (
              <textarea 
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500" 
                rows="4" 
                placeholder="Digite sua resposta aqui..."
                value={answers[q.id] || ''}
                onChange={(e) => handleAnswerChange(q.id, e.target.value)}
              />
            )}
            
            {/* O tipo Verdadeiro/Falso seguiria a mesma lógica de radio buttons do Múltipla Escolha */}
          </div>
        ))}

        <div className="flex justify-end mt-8">
          <button 
            onClick={() => handleSubmit(false)}
            disabled={isSubmitting}
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl font-bold text-lg shadow-lg disabled:opacity-50"
          >
            {isSubmitting ? 'Enviando...' : 'Finalizar e Enviar Prova'}
          </button>
        </div>
      </div>
    </div>
  );
}