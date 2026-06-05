import { useState } from 'react';

export default function QuizCreator() {
  const [isSaving, setIsSaving] = useState(false);
  const [quizData, setQuizData] = useState({
    title: '',
    duration: 60,
    startDate: '',
    endDate: '',
    feedbackStrategy: 'AFTER_CLOSE'
  });

  const [questions, setQuestions] = useState([]);

  // Adiciona uma nova questão em branco à lista
  const addQuestion = (type) => {
    const newQuestion = {
      id: Date.now(), // ID temporário apenas para o React
      content: '',
      type: type,
      details: type === 'MULTIPLE_CHOICE' 
        ? { options: ['', '', '', ''], correctOptionIndex: 0 } 
        : type === 'TRUE_FALSE' 
          ? { correctAnswer: true } 
          : { keywords: [], rubric: '' } // Para dissertativas
    };
    setQuestions([...questions, newQuestion]);
  };

  const removeQuestion = (id) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  // Atualiza um campo específico de uma questão
  const updateQuestion = (id, field, value) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, [field]: value } : q));
  };

  // Atualiza os "detalhes" (como opções ou gabarito) de uma questão
  const updateQuestionDetails = (id, detailsField, value) => {
    setQuestions(questions.map(q => {
      if (q.id === id) {
        return { ...q, details: { ...q.details, [detailsField]: value } };
      }
      return q;
    }));
  };

  // 👇 AQUI ESTÁ A MÁGICA: A FUNÇÃO CONECTADA AO BANCO DE DADOS 👇
  const handleSaveQuiz = async () => {
    if (!quizData.title) {
      return alert('Preencha pelo menos o título da prova!');
    }

    setIsSaving(true);
    try {
      const userId = localStorage.getItem('userId');

      const response = await fetch('/api/quizzes', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          title: quizData.title,
          duration: quizData.duration,
          professorId: userId,
          questions: questions // 💡 ADICIONE ESTA LINHA AQUI!
        })
      });

      if (!response.ok) {
        throw new Error('Falha ao salvar no banco de dados.');
      }

      alert('Prova criada e salva no sistema com sucesso!');
      
      // Limpa os campos para o professor poder criar uma nova prova
      setQuizData({ title: '', duration: 60, startDate: '', endDate: '', feedbackStrategy: 'AFTER_CLOSE' });
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
        
        {/* Configurações Gerais da Prova */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Título da Prova</label>
            <input 
              type="text" 
              className="mt-1 w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ex: Prova Bimestral de História"
              value={quizData.title}
              onChange={e => setQuizData({...quizData, title: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Início da Disponibilidade</label>
            <input 
              type="datetime-local" 
              className="mt-1 w-full p-2 border rounded"
              value={quizData.startDate}
              onChange={e => setQuizData({...quizData, startDate: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Fim da Disponibilidade</label>
            <input 
              type="datetime-local" 
              className="mt-1 w-full p-2 border rounded"
              value={quizData.endDate}
              onChange={e => setQuizData({...quizData, endDate: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Tempo Limite (Minutos)</label>
            <input 
              type="number" 
              className="mt-1 w-full p-2 border rounded"
              value={quizData.duration}
              onChange={e => setQuizData({...quizData, duration: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Liberação de Resultados</label>
            <select 
              className="mt-1 w-full p-2 border rounded"
              value={quizData.feedbackStrategy}
              onChange={e => setQuizData({...quizData, feedbackStrategy: e.target.value})}
            >
              <option value="IMMEDIATE">Imediato (Ao enviar)</option>
              <option value="AFTER_CLOSE">Apenas após o fim do prazo</option>
              <option value="MANUAL">Apenas quando eu liberar</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Questões */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-gray-800">Questões ({questions.length})</h2>
        
        {questions.map((q, index) => (
          <div key={q.id} className="bg-white p-6 rounded-xl shadow-sm border border-l-4 border-l-blue-600">
            <div className="flex justify-between items-start mb-4">
              <span className="font-bold text-gray-600">Questão {index + 1} - {
                q.type === 'MULTIPLE_CHOICE' ? 'Múltipla Escolha' : 
                q.type === 'TRUE_FALSE' ? 'Verdadeiro ou Falso' : 'Dissertativa'
              }</span>
              <button onClick={() => removeQuestion(q.id)} className="text-red-500 hover:text-red-700 text-sm font-medium">Remover</button>
            </div>

            <textarea 
              className="w-full p-3 border rounded-lg mb-4 outline-none focus:ring-2 focus:ring-blue-200" 
              rows="2" 
              placeholder="Digite o enunciado da questão aqui..."
              value={q.content}
              onChange={e => updateQuestion(q.id, 'content', e.target.value)}
            />

            {/* Renderização condicional baseada no tipo da questão */}
            {q.type === 'MULTIPLE_CHOICE' && (
              <div className="space-y-2">
                {q.details.options.map((opt, i) => (
                  <div key={i} className="flex items-center space-x-2">
                    <input 
                      type="radio" 
                      name={`correct-${q.id}`} 
                      checked={q.details.correctOptionIndex === i}
                      onChange={() => updateQuestionDetails(q.id, 'correctOptionIndex', i)}
                      title="Marque para definir como alternativa correta"
                    />
                    <input 
                      type="text" 
                      className={`flex-1 p-2 border rounded outline-none ${q.details.correctOptionIndex === i ? 'border-green-500 bg-green-50' : ''}`}
                      placeholder={`Alternativa ${String.fromCharCode(65 + i)}`}
                      value={opt}
                      onChange={(e) => {
                        const newOptions = [...q.details.options];
                        newOptions[i] = e.target.value;
                        updateQuestionDetails(q.id, 'options', newOptions);
                      }}
                    />
                  </div>
                ))}
              </div>
            )}

            {q.type === 'TRUE_FALSE' && (
              <div className="flex space-x-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input 
                    type="radio" 
                    checked={q.details.correctAnswer === true} 
                    onChange={() => updateQuestionDetails(q.id, 'correctAnswer', true)}
                  />
                  <span className="font-medium text-green-700">Verdadeiro é a resposta correta</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input 
                    type="radio" 
                    checked={q.details.correctAnswer === false} 
                    onChange={() => updateQuestionDetails(q.id, 'correctAnswer', false)}
                  />
                  <span className="font-medium text-red-700">Falso é a resposta correta</span>
                </label>
              </div>
            )}

            {q.type === 'ESSAY' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rubrica de Correção (O que o professor deve avaliar?)</label>
                <textarea 
                  className="w-full p-2 border rounded bg-yellow-50 outline-none focus:ring-2 focus:ring-yellow-200" 
                  rows="2" 
                  placeholder="Ex: 1 ponto para clareza, 1 ponto se citar o conceito de Fotossíntese..."
                  value={q.details.rubric}
                  onChange={e => updateQuestionDetails(q.id, 'rubric', e.target.value)}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Botões de Ação */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 border border-gray-200 shadow-sm rounded-xl gap-4">
        <div className="flex flex-wrap gap-2">
          <button onClick={() => addQuestion('MULTIPLE_CHOICE')} className="bg-gray-50 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg shadow-sm hover:bg-gray-100 text-sm font-medium transition-colors">+ Múltipla Escolha</button>
          <button onClick={() => addQuestion('TRUE_FALSE')} className="bg-gray-50 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg shadow-sm hover:bg-gray-100 text-sm font-medium transition-colors">+ Verdadeiro/Falso</button>
          <button onClick={() => addQuestion('ESSAY')} className="bg-gray-50 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg shadow-sm hover:bg-gray-100 text-sm font-medium transition-colors">+ Dissertativa</button>
        </div>
        
        <button 
          onClick={handleSaveQuiz}
          disabled={isSaving}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold shadow-md disabled:opacity-50 w-full md:w-auto transition-colors"
        >
          {isSaving ? 'Salvando...' : 'Salvar Prova no Sistema'}
        </button>
      </div>
    </div>
  );
}