// components/QuestionList.jsx


export default function QuestionList({ questions, onEdit, onDelete }) {
  if (questions.length === 0) {
    return <p className="text-gray-500 text-center py-8">Nenhuma questão cadastrada no seu banco.</p>;
  }

  const badgeColors = {
    MULTIPLE_CHOICE: 'bg-purple-100 text-purple-800',
    TRUE_FALSE: 'bg-green-100 text-green-800',
    ESSAY: 'bg-yellow-100 text-yellow-800'
  };

  const labelTypes = {
    MULTIPLE_CHOICE: 'Múltipla Escolha',
    TRUE_FALSE: 'Verdadeiro/Falso',
    ESSAY: 'Dissertativa'
  };

  return (
    <div className="space-y-4">
      {questions.map((q) => (
        <div key={q.id} className="border rounded-xl p-4 bg-white shadow-sm flex justify-between items-start">
          <div className="space-y-2">
            <span className={`text-xs px-2 py-1 rounded-full font-semibold ${badgeColors[q.type]}`}>
              {labelTypes[q.type]}
            </span>
            <p className="text-gray-700 font-medium">{q.content}</p>
          </div>
          
          <div className="flex space-x-2 ml-4">
            <button onClick={() => onEdit(q)} className="text-blue-600 hover:text-blue-800 text-sm font-medium">Editar</button>
            <button onClick={() => onDelete(q.id)} className="text-red-600 hover:text-red-800 text-sm font-medium">Excluir</button>
          </div>
        </div>
      ))}
    </div>
  );
}