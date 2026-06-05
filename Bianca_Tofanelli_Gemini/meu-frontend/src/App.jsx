import { useState } from 'react';
import Login from './components/Login';
import TeacherDashboard from './components/TeacherDashboard';
import StudentDashboard from './components/StudentDashboard';
import QuizCreator from './components/QuizCreator';
import QuizPlayer from './components/QuizPlayer';
function App() {
  // Inicialização direta para evitar avisos de performance do React
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem('token'));
  const [userRole, setUserRole] = useState(() => localStorage.getItem('userRole'));
  const [currentView, setCurrentView] = useState('home');
  const [activeQuizId, setActiveQuizId] = useState(null);
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    setIsAuthenticated(false);
    setUserRole(null);
    setCurrentView('home');
  };

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    setUserRole(localStorage.getItem('userRole'));
  };

  // Se o usuário não estiver logado, bloqueia a entrada e mostra o Login
  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // Estilização dos botões de navegação
  const getButtonClass = (viewName) => {
    const baseClass = "font-bold transition-colors duration-200 px-4 py-2 rounded-lg ";
    return baseClass + (currentView === viewName 
      ? "bg-blue-100 text-blue-800" 
      : "text-gray-600 hover:bg-gray-100 hover:text-blue-600");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      
      {/* Menu Superior de Navegação */}
      <nav className="max-w-5xl mx-auto mb-8 bg-white p-3 rounded-2xl shadow-sm flex flex-wrap gap-2 items-center justify-between border border-gray-100">
        <div className="flex gap-2 items-center">
          <button onClick={() => setCurrentView('home')} className={getButtonClass('home')}>Início</button>
          
          {userRole === 'PROFESSOR' && (
            <>
              <div className="h-6 w-px bg-gray-200 mx-1"></div>
              <button onClick={() => setCurrentView('create')} className={getButtonClass('create')}>Criar Prova</button>
              <button onClick={() => setCurrentView('teacher')} className={getButtonClass('teacher')}>Relatórios</button>
            </>
          )}

          {userRole === 'ALUNO' && (
            <>
              <div className="h-6 w-px bg-gray-200 mx-1"></div>
              <button onClick={() => setCurrentView('student')} className={getButtonClass('student')}>Minhas Provas</button>
            </>
          )}
        </div>
        
        <button 
          onClick={handleLogout} 
          className="text-red-600 text-sm font-bold px-4 py-2 hover:bg-red-50 rounded-lg transition-colors"
        >
          Sair
        </button>
      </nav>

      {/* Área Dinâmica de Conteúdo */}
      <main className="max-w-5xl mx-auto">
        {currentView === 'home' && (
          <div className="text-center mt-20 p-10 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
              Bem-vindo ao Sistema, {userRole === 'PROFESSOR' ? 'Professor(a)' : 'Aluno(a)'}!
            </h1>
            <p className="text-gray-500 text-lg">Use o menu superior para gerenciar suas avaliações.</p>
          </div>
        )}
        
        {currentView === 'create' && <QuizCreator />}
        {currentView === 'teacher' && <TeacherDashboard />}
        {currentView === 'student' && (
       <StudentDashboard onStartQuiz={(id) => {
         setActiveQuizId(id);
         setCurrentView('taking_quiz'); // Troca a tela!
       }} />
     )}

     {currentView === 'taking_quiz' && (
       <QuizPlayer 
         quizId={activeQuizId} 
         onFinish={() => setCurrentView('student')} // Volta pro painel ao entregar
       />
     )}
      </main>
    </div>
  );
}

export default App;