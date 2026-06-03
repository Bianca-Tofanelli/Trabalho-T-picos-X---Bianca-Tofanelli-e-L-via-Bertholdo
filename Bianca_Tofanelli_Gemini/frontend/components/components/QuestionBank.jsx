// components/QuestionBank.jsx
import React, { useState, useEffect } from 'react';
import QuestionList from './QuestionList';
import QuestionForm from './QuestionForm';

export default function QuestionBank() {
  const [questions, setQuestions] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    // Em produção, adicione o header Authorization: Bearer <token>
    const res = await fetch('/api/questions'); 
    const data = await res.json();
    setQuestions(data);
  };

  const handleEdit = (question) => {
    setEditingQuestion(question);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Deseja realmente excluir esta questão?')) {
      await fetch(`/api/questions/${id}`, { method: 'DELETE' });
      fetchQuestions();
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
          onSave={fetchQuestions} 
        />
      )}
    </div>
  );
}