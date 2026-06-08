import { useState } from 'react';
import API_URL from '../apiConfig';

export default function QuizCreator() {
  const [isSaving, setIsSaving] = useState(false);
  
  const [quizData, setQuizData] = useState({
    title: '',
    duration: 60,
    startDate: '',
    endDate: '',
    releaseMode: 'IMMEDIATE' 
  });

  const [questions, setQuestions] = useState([]);

  const addQuestion = (type) => {
    const newQuestion = {
      // 👇 Correção 2: Garante que o ID seja 100% único mesmo com duplo clique
      id: Date.now() + Math.random(), 
      content: '',
      type: type,
      details: type === 'MULTIPLE_CHOICE' 
        ? { options: ['', '', '', ''], correctOptionIndex: 0, peso: 1 } 
        : type === 'TRUE_FALSE' 
          ? { correctAnswer: true, peso: 1 } 
          : { keywords: [], rubric: '', peso: 1 } 
    };
    setQuestions([...questions, newQuestion]);
  };

  const removeQuestion = (id) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const updateQuestion = (id, field, value) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, [field]: value } : q));
  };

  const updateQuestionDetails = (id, detailsField, value) => {
    setQuestions(questions.map(q => {
      if (q.id === id) {
        return { ...q, details: { ...q.details, [detailsField]: value } };
      }
      return q;
    }));
  };

  // Calcula a soma normalmente
  const somaDosPontos = questions.reduce((acc, q) => acc + Number(q.details.peso || 0), 0);
  
  // 👇 Correção 1: Resolve o bug de matemática do JavaScript (ex: 9.999999 !== 10)
  const isSomaDez = somaDosPontos.toFixed(1) === '10.0';

  const handleSaveQuiz = async () => {
    if (!quizData.title) {
      return alert('Preencha o título da prova!');
    }
    if (!quizData.startDate) {
      return alert('Escolha a data e horário de INÍCIO da disponibilidade da prova!');
    }
    if (!quizData.endDate) {
      return alert('Escolha a data e horário de FIM da disponibilidade da prova!');
    }
    
    if (new Date(quizData.startDate) >= new Date(quizData.endDate)) {
      return alert('Ops! A data de encerramento da prova deve ser DEPOIS da data de início.');
    }

    if (!isSomaDez) {
      return alert(`A soma dos pesos das questões é ${somaDosPontos.toFixed(1)}. Ela precisa ser EXATAMENTE 10.0 para você poder salvar a prova!`);
    }

    setIsSaving(true);
    try {
      const userId = localStorage.getItem('userId');
      const dataInicioFormatada = new Date(quizData.startDate).toISOString();
      const dataFimFormatada = new Date(quizData.endDate).toISOString();

      const response = await fetch(`${API_URL}/api/quizzes`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          title: quizData.title,
          duration: quizData.duration,
          startDate: dataInicioFormatada, 
          endDate: dataFimFormatada,      
          professorId: userId,
          releaseMode: quizData.releaseMode, 
          questions: questions
        })
      });

      if (!response.ok) throw new Error('Falha ao salvar no banco de dados.');

      alert('Prova criada e salva no sistema com sucesso!');
      
      setQuizData({ title: '', duration: 60, startDate: '', endDate: '', releaseMode: 'IMMEDIATE' });
      setQuestions([]);

    } catch (error) {
      console.error(error);
      alert('Erro de conexão ao tentar criar a prova.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Criar Nova Prova</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Título da Prova *</label>
            <input 
              type="text" className="mt-1 w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ex: Prova Bimestral de História" value={quizData.title}
              onChange={e => setQuizData({...quizData, title: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Início da Disponibilidade *</label>
            <input type="datetime-local" className="mt-1 w-full p-2 border rounded" value={quizData.startDate} onChange={e => setQuizData({...quizData, startDate: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Fim da Disponibilidade *</label>
            <input type="datetime-local" className="mt-1 w-full p-2 border rounded" value={quizData.endDate} onChange={e => setQuizData({...quizData, endDate: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Tempo Limite (Minutos)</label>
            <input type="number" className="mt-1 w-full p-2 border rounded" value={quizData.duration} onChange={e => setQuizData({...quizData, duration: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Liberação de Resultados</label>
            <select className="mt-1 w-full p-2 border rounded" value={quizData.releaseMode} onChange={e => setQuizData({...quizData, releaseMode: e.target.value})}>
              <option value="IMMEDIATE">Imediato (Ao entregar a prova)</option>
              <option value="AFTER_DEADLINE">Apenas após o fim do prazo</option>
              <option value="MANUAL">Manualmente (Apenas quando eu liberar)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex justify-between items-end border-b border-gray-200 pb-2">
          <h2 className="text-xl font-bold text-gray-800">Questões ({questions.length})</h2>
          
          <div className={`px-4 py-2 rounded-lg font-bold text-sm ${isSomaDez ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200 animate-pulse'}`}>
            Soma da Prova: {somaDosPontos.toFixed(1)} / 10.0 pts
          </div>
        </div>
        
        {questions.map((q, index) => (
          <div key={q.id} className="bg-white p-6 rounded-xl shadow-sm border border-l-4 border-l-blue-600">
            <div className="flex justify-between items-center mb-4">
              <span className="font-bold text-gray-600">
                Questão {index + 1} - {q.type === 'MULTIPLE_CHOICE' ? 'Múltipla Escolha' : q.type === 'TRUE_FALSE' ? 'Verdadeiro ou Falso' : 'Dissertativa'}
              </span>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded border border-blue-100">
                  <label className="text-sm font-bold text-blue-800">Valor (Pts):</label>
                  <input 
                    type="number" step="0.1" min="0" 
                    className="w-16 p-1 text-center font-bold border rounded outline-none"
                    value={q.details.peso || 1}
                    onChange={(e) => updateQuestionDetails(q.id, 'peso', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <button onClick={() => removeQuestion(q.id)} className="text-red-500 hover:text-red-700 text-sm font-medium">Remover</button>
              </div>
            </div>

            <textarea 
              className="w-full p-3 border rounded-lg mb-4 outline-none focus:ring-2 focus:ring-blue-200" 
              rows="2" placeholder="Digite o enunciado da questão aqui..."
              value={q.content} onChange={e => updateQuestion(q.id, 'content', e.target.value)}
            />

            {q.type === 'MULTIPLE_CHOICE' && (
              <div className="space-y-2">
                {q.details.options.map((opt, i) => (
                  <div key={i} className="flex items-center space-x-2">
                    <input type="radio" name={`correct-${q.id}`} checked={q.details.correctOptionIndex === i} onChange={() => updateQuestionDetails(q.id, 'correctOptionIndex', i)} />
                    <input type="text" className={`flex-1 p-2 border rounded outline-none ${q.details.correctOptionIndex === i ? 'border-green-500 bg-green-50' : ''}`} placeholder={`Alternativa ${String.fromCharCode(65 + i)}`} value={opt} onChange={(e) => {
                        const newOptions = [...q.details.options];
                        newOptions[i] = e.target.value;
                        updateQuestionDetails(q.id, 'options', newOptions);
                      }} />
                  </div>
                ))}
              </div>
            )}

            {q.type === 'TRUE_FALSE' && (
              <div className="flex space-x-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input type="radio" checked={q.details.correctAnswer === true} onChange={() => updateQuestionDetails(q.id, 'correctAnswer', true)} />
                  <span className="font-medium text-green-700">Verdadeiro</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input type="radio" checked={q.details.correctAnswer === false} onChange={() => updateQuestionDetails(q.id, 'correctAnswer', false)} />
                  <span className="font-medium text-red-700">Falso</span>
                </label>
              </div>
            )}

            {q.type === 'ESSAY' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">O que o professor deve avaliar?</label>
                <textarea className="w-full p-2 border rounded bg-yellow-50 outline-none focus:ring-2 focus:ring-yellow-200" rows="2" placeholder="Ex: 1 ponto para clareza, 1 ponto se citar o conceito..." value={q.details.rubric} onChange={e => updateQuestionDetails(q.id, 'rubric', e.target.value)} />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 border border-gray-200 shadow-sm rounded-xl gap-4">
        <div className="flex flex-wrap gap-2">
          <button onClick={() => addQuestion('MULTIPLE_CHOICE')} className="bg-gray-50 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg shadow-sm hover:bg-gray-100 text-sm font-medium">+ Múltipla Escolha</button>
          <button onClick={() => addQuestion('TRUE_FALSE')} className="bg-gray-50 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg shadow-sm hover:bg-gray-100 text-sm font-medium">+ Verdadeiro/Falso</button>
          <button onClick={() => addQuestion('ESSAY')} className="bg-gray-50 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg shadow-sm hover:bg-gray-100 text-sm font-medium">+ Dissertativa</button>
        </div>
        
        <button 
          onClick={handleSaveQuiz} 
          disabled={isSaving || !isSomaDez} 
          className={`px-8 py-3 rounded-xl font-bold shadow-md w-full md:w-auto transition-colors ${
            isSomaDez 
              ? 'bg-blue-600 hover:bg-blue-700 text-white' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isSaving ? 'Salvando...' : isSomaDez ? 'Salvar Prova no Sistema' : 'A soma deve ser 10.0'}
        </button>
      </div>
    </div>
  );
}