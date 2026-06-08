// components/QuestionBank.jsx
import { useState, useEffect } from 'react';
import API_URL from '../apiConfig'; 
import QuestionList from './QuestionList';
import QuestionForm from './QuestionForm';

export default function QuestionBank() {
  const [questions, setQuestions] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);

  // 👇 1. Busca INICIAL (O Linter adora quando a função fica presa dentro do useEffect)
  useEffect(() => {
    let isMounted = true; // Previne atualização de estado em componente desmontado

    const loadInitialQuestions = async () => {
      try {
        const res = await fetch(`${API_URL}/api/questions`); 
        if (res.ok) {
          const data = await res.json();
          // Só atualiza o estado se a tela ainda estiver aberta
          if (isMounted) setQuestions(data); 
        }
      } catch (error) {
        console.error("Erro ao carregar questões iniciais:", error);
      }
    };

    loadInitialQuestions();

    return () => {
      isMounted = false; // Função de limpeza (cleanup)
    };
  }, []); // Array vazio garante que rode apenas 1x

  // 👇 2. Busca MANUAL (Usada quando salvamos ou deletamos uma questão)
  const refreshQuestions = async () => {
    try {
      const res = await fetch(`${API_URL}/api/questions`); 
      if (res.ok) {
        const data = await res.json();
        setQuestions(data);
      }
    } catch (error) {
      console.error("Erro ao atualizar questões:", error);
    }
  };

  const handleEdit = (question) => {
    setEditingQuestion(question);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Deseja realmente excluir esta questão?')) {
      await fetch(`${API_URL}/api/questions/${id}`, { method: 'DELETE' });
      refreshQuestions(); // Chama a busca manual
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingQuestion(null);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Banco de Questões</h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
        >
          Nova Questão
        </button>
      </div>

      <QuestionList 
        questions={questions} 
        onEdit={handleEdit} 
        onDelete={handleDelete} 
      />

      {isModalOpen && (
        <QuestionForm 
          question={editingQuestion} 
          onClose={handleCloseModal} 
          onSave={refreshQuestions} // Chama a busca manual ao salvar
        />
      )}
    </div>
  );
}