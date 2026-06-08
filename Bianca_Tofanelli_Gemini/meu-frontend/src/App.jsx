import { useState } from 'react';
import API_URL from './apiConfig'; // 👈 Importação da nossa variável da nuvem!
import Login from './components/Login';
import TeacherDashboard from './components/TeacherDashboard';
import StudentDashboard from './components/StudentDashboard';
import QuizCreator from './components/QuizCreator';
import QuizPlayer from './components/QuizPlayer';
import QuizResult from './components/QuizResult';

function App() {
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

  const handleDeleteAccount = async () => {
    const confirmar = window.prompt("⚠️ ATENÇÃO: Esta ação é irreversível e apagará todos os seus dados e provas!\n\nDigite 'EXCLUIR' para confirmar:");
    
    if (confirmar !== 'EXCLUIR') {
      return alert("Ação cancelada. Sua conta está segura.");
    }

    try {
      const userId = localStorage.getItem('userId');
      
      // 👇 CORREÇÃO: API_URL injetado na rota de deletar a conta 👇
      const response = await fetch(`${API_URL}/api/auth/usuario/${userId}`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (!response.ok) throw new Error('Falha ao excluir a conta.');

      alert("Sua conta foi excluída com sucesso. Sentiremos sua falta!");
      handleLogout(); // Expulsa o usuário limpando o sistema
      
    } catch (error) {
      console.error(error);
      alert("Erro ao tentar excluir a conta. Verifique sua conexão.");
    }
  };

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    setUserRole(localStorage.getItem('userRole'));
  };

  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

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
          <div className="text-center mt-20 p-10 bg-white rounded-3xl border border-gray-100 shadow-sm space-y-6">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
              Bem-vindo ao Sistema, {userRole === 'PROFESSOR' ? 'Professor(a)' : 'Aluno(a)'}!
            </h1>
            <p className="text-gray-500 text-lg">Use o menu superior para gerenciar suas avaliações.</p>
            
            {/* 👇 ÁREA DE CONFIGURAÇÕES DA CONTA 👇 */}
            <div className="pt-10 mt-10 border-t border-gray-100 max-w-sm mx-auto">
              <p className="text-sm text-gray-400 mb-4 uppercase font-bold tracking-wider">Configurações da Conta</p>
              <button 
                onClick={handleDeleteAccount}
                className="w-full bg-red-50 hover:bg-red-600 text-red-600 hover:text-white border border-red-200 font-bold py-3 px-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 group"
              >
                <svg className="w-5 h-5 group-hover:animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Excluir Minha Conta Permanentemente
              </button>
            </div>
          </div>
        )}
        
        {currentView === 'create' && <QuizCreator />}
        {currentView === 'teacher' && <TeacherDashboard />}
        
        {currentView === 'student' && (
          <StudentDashboard onStartQuiz={(id, isResult = false) => {
            setActiveQuizId(id);
            setCurrentView(isResult ? 'view_result' : 'taking_quiz'); 
          }} />
        )}

        {currentView === 'taking_quiz' && (
          <QuizPlayer 
            quizId={activeQuizId} 
            onFinish={() => setCurrentView('student')} 
          />
        )}

        {currentView === 'view_result' && (
          <QuizResult 
            quizId={activeQuizId} 
            onBack={() => setCurrentView('student')} 
          />
        )}

      </main>
    </div>
  );
}

export default App;