// components/StudentDashboard.jsx
import React, { useState, useEffect } from 'react';

export default function StudentDashboard({ onStartQuiz }) {
  const [dashboard, setDashboard] = useState({ available: [], completed: [], missed: [] });

  useEffect(() => {
    // Aqui usaria o fetch real com o token JWT do aluno
    fetch('/api/student/dashboard', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => res.json())
      .then(data => setDashboard(data));
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold">Meu Painel</h1>

      <section>
        <h2 className="text-xl font-bold text-green-700 border-b pb-2 mb-4">Provas Disponíveis</h2>
        {dashboard.available.length === 0 && <p className="text-gray-500">Nenhuma prova no momento.</p>}
        <div className="grid gap-4">
          {dashboard.available.map(quiz => (
            <div key={quiz.id} className="p-4 border rounded-xl shadow-sm flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg">{quiz.title}</h3>
                <p className="text-sm text-gray-600">Duração: {quiz.duration} minutos</p>
              </div>
              <button 
                onClick={() => onStartQuiz(quiz.id)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700"
              >
                Iniciar Prova
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Renderize as seções 'completed' e 'missed' de forma parecida aqui... */}
      
    </div>
  );
}