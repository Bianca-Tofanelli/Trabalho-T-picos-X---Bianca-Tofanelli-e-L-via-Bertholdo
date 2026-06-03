// components/QuestionForm.jsx
import React, { useState, useEffect } from 'react';

export default function QuestionForm({ question, onClose, onSave }) {
  const [type, setType] = useState('MULTIPLE_CHOICE');
  const [content, setContent] = useState('');
  
  // Estados dinâmicos dos detalhes
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctOptionIndex, setCorrectOptionIndex] = useState(0);
  const [correctAnswerTF, setCorrectAnswerTF] = useState(true);
  const [keywords, setKeywords] = useState('');

  useEffect(() => {
    if (question) {
      setType(question.type);
      setContent(question.content);
      if (question.type === 'MULTIPLE_CHOICE') {
        setOptions(question.details.options);
        setCorrectOptionIndex(question.details.correctOptionIndex);
      } else if (question.type === 'TRUE_FALSE') {
        setCorrectAnswerTF(question.details.correctAnswer);
      } else if (question.type === 'ESSAY') {
        setKeywords(question.details.keywords?.join(', ') || '');
      }
    }
  }, [question]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    let details = {};
    if (type === 'MULTIPLE_CHOICE') {
      details = { options, correctOptionIndex };
    } else if (type === 'TRUE_FALSE') {
      details = { correctAnswer: correctAnswerTF };
    } else if (type === 'ESSAY') {
      details = { keywords: keywords.split(',').map(k => k.trim()).filter(Boolean) };
    }

    const payload = { content, type, details };
    const url = question ? `/api/questions/${question.id}` : '/api/questions';
    const method = question ? 'PUT' : 'POST';

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    onSave();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl">
        <h2 className="text-xl font-bold mb-4">{question ? 'Editar Questão' : 'Nova Questão'}</h2>
        
        {/* Enunciado (Texto Rico seria implementado aqui via biblioteca como Quill/TipTap) */}
        <div className="mb-4">
          <label className="block text-sm font-semibold mb-1">Enunciado (Texto Rico)</label>
          <textarea 
            className="w-full border p-2 rounded-lg" 
            rows="3" 
            value={content} 
            onChange={(e) => setContent(e.target.value)} 
            required
            placeholder="Digite o enunciado aqui..."
          />
        </div>

        {/* Tipo da Questão */}
        <div className="mb-4">
          <label className="block text-sm font-semibold mb-1">Tipo</label>
          <select className="w-full border p-2 rounded-lg" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="MULTIPLE_CHOICE">Múltipla Escolha</option>
            <option value="TRUE_FALSE">Verdádeiro / Falso</option>
            <option value="ESSAY">Dissertativa</option>
          </select>
        </div>

        {/* Renderização Condicional com base no Tipo */}
        {type === 'MULTIPLE_CHOICE' && (
          <div className="mb-4 space-y-2">
            <label className="block text-sm font-semibold">Alternativas e Resposta Correta</label>
            {options.map((opt, idx) => (
              <div key={idx} className="flex items-center space-x-2">
                <input 
                  type="radio" 
                  name="correctOption" 
                  checked={correctOptionIndex === idx} 
                  onChange={() => setCorrectOptionIndex(idx)}
                />
                <input 
                  type="text" 
                  className="w-full border p-1 rounded" 
                  value={opt} 
                  placeholder={`Alternativa ${idx + 1}`}
                  onChange={(e) => {
                    const newOpts = [...options];
                    newOpts[idx] = e.target.value;
                    setOptions(newOpts);
                  }}
                  required
                />
              </div>
            ))}
          </div>
        )}

        {type === 'TRUE_FALSE' && (
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-1">Gabarito Correto</label>
            <div className="space-x-4">
              <label><input type="radio" checked={correctAnswerTF === true} onChange={() => setCorrectAnswerTF(true)} /> Verdadeiro</label>
              <label><input type="radio" checked={correctAnswerTF === false} onChange={() => setCorrectAnswerTF(false)} /> Falso</label>
            </div>
          </div>
        )}

        {type === 'ESSAY' && (
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-1">Palavras-chave Esperadas (Separadas por vírgula)</label>
            <input 
              type="text" 
              className="w-full border p-2 rounded-lg" 
              value={keywords} 
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="Ex: fotossíntese, cloroplasto, luz"
            />
          </div>
        )}

        {/* Ações */}
        <div className="flex justify-end space-x-2 mt-6">
          <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg text-gray-600">Cancelar</button>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">Salvar</button>
        </div>
      </form>
    </div>
  );
}