import { useState, useEffect } from 'react';
import API_URL from '../apiConfig';

export default function SecretaryDashboard() {
  const [usuarios, setUsuarios] = useState([]);
  const [provas, setProvas] = useState([]);
  const [submissoes, setSubmissoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [abaAtiva, setAbaAtiva] = useState('usuarios');

  const currentUserId = localStorage.getItem('userId');

  // 👇 O Linter fica feliz quando a função de busca vive DENTRO do useEffect
  useEffect(() => {
    let isMounted = true;

    const carregarDadosSecretaria = async () => {
      try {
        const res = await fetch(`${API_URL}/api/secretario/dados`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (!res.ok) throw new Error('Não foi possível carregar os dados do sistema.');
        
        const data = await res.json();
        
        if (isMounted) {
          setUsuarios(data.usuarios || []);
          setProvas(data.provas || []);
          setSubmissoes(data.submissoes || []);
        }
      } catch (err) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    carregarDadosSecretaria();

    return () => {
      isMounted = false; // Trava de segurança contra Memory Leak
    };
  }, []); // Array vazio: roda só uma vez quando a tela abre

  const handleDeleteUser = async (targetUserId, targetUserName) => {
    const confirmacao = window.prompt(`⚠️ ATENÇÃO: Você está prestes a excluir a conta de ${targetUserName}.\nIsso apagará permanentemente todos os registros vinculados!\n\nDigite 'EXCLUIR' para prosseguir:`);
    
    if (confirmacao !== 'EXCLUIR') return alert('Ação cancelada.');

    try {
      const res = await fetch(`${API_URL}/api/auth/usuario/${targetUserId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (!res.ok) throw new Error('Erro ao processar a exclusão no servidor.');

      alert('Usuário removido com sucesso!');
      
      if (String(targetUserId) === String(currentUserId)) {
        localStorage.clear();
        window.location.reload();
        return;
      }

      setUsuarios(prev => prev.filter(u => u.id !== targetUserId));
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="p-10 text-center font-bold text-blue-600">Carregando painel de controle geral...</div>;
  if (error) return <div className="p-10 text-center font-bold text-red-600">⚠️ Erro: {error}</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h1 className="text-3xl font-black text-gray-900">Painel de Controle da Secretaria</h1>
        <p className="text-gray-500 mt-1">Gerenciamento global de usuários, turmas e auditoria de exames.</p>
      </div>

      {/* Navegação entre Abas */}
      <div className="flex border-b border-gray-200 gap-2">
        <button 
          onClick={() => setAbaAtiva('usuarios')} 
          className={`py-2 px-4 font-bold border-b-2 text-sm transition-all ${abaAtiva === 'usuarios' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          👥 Usuários Cadastrados ({usuarios.length})
        </button>
        <button 
          onClick={() => setAbaAtiva('professores')} 
          className={`py-2 px-4 font-bold border-b-2 text-sm transition-all ${abaAtiva === 'professores' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          👨‍🏫 Provas por Professor ({provas.length})
        </button>
        <button 
          onClick={() => setAbaAtiva('alunos')} 
          className={`py-2 px-4 font-bold border-b-2 text-sm transition-all ${abaAtiva === 'alunos' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          🎓 Atividades dos Alunos ({submissoes.length})
        </button>
      </div>

      {/* CONTEÚDO DA ABA 1: USUÁRIOS */}
      {abaAtiva === 'usuarios' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-600 text-xs font-bold uppercase tracking-wider">
                <th className="p-4">ID</th>
                <th className="p-4">Nome</th>
                <th className="p-4">Email</th>
                <th className="p-4">Nível de Acesso</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {usuarios.map(u => (
                <tr key={u.id} className="hover:bg-gray-50 text-sm">
                  <td className="p-4 font-semibold text-gray-500">{u.id}</td>
                  <td className="p-4 font-bold text-gray-800">{u.name} {String(u.id) === String(currentUserId) && '(Você)'}</td>
                  <td className="p-4 text-gray-600">{u.email}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${u.role === 'PROFESSOR' ? 'bg-purple-100 text-purple-800' : u.role === 'ALUNO' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => handleDeleteUser(u.id, u.name)}
                      className="bg-red-50 hover:bg-red-600 text-red-600 hover:text-white px-3 py-1.5 rounded-lg font-bold border border-red-100 text-xs transition-colors"
                    >
                      Excluir Conta
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* CONTEÚDO DA ABA 2: PROFESSORES */}
      {abaAtiva === 'professores' && (
        <div className="grid gap-4 md:grid-cols-2">
          {provas.map(p => (
            <div key={p.id} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-purple-600 uppercase bg-purple-50 px-2 py-1 rounded">
                  Criador: {p.professor?.name || 'Não Identificado'}
                </span>
                <h3 className="font-bold text-lg text-gray-900 mt-2">{p.title}</h3>
                <p className="text-sm text-gray-500 mt-1">Duração máxima: <strong>{p.duration} minutos</strong></p>
              </div>
              <div className="text-xs text-gray-400 mt-4 pt-2 border-t border-gray-50">
                ID da Prova no Sistema: {p.id}
              </div>
            </div>
          ))}
          {provas.length === 0 && <p className="text-gray-500 italic p-4 text-center col-span-2">Nenhuma prova foi criada no sistema até o momento.</p>}
        </div>
      )}

      {/* CONTEÚDO DA ABA 3: ALUNOS */}
      {abaAtiva === 'alunos' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-600 text-xs font-bold uppercase tracking-wider">
                <th className="p-4">Aluno</th>
                <th className="p-4">Prova Realizada</th>
                <th className="p-4">Status de Correção</th>
                <th className="p-4 text-right">Nota Obtida</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {submissoes.map(s => (
                <tr key={s.id} className="hover:bg-gray-50 text-sm">
                  <td className="p-4 font-bold text-gray-800">{s.student?.name || `ID: ${s.studentId}`}</td>
                  <td className="p-4 text-gray-700 font-medium">{s.quiz?.title || `ID da Prova: ${s.quizId}`}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${s.status === 'GRADED' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                      {s.status === 'GRADED' ? 'Corrigida' : 'Aguardando Revisão'}
                    </span>
                  </td>
                  <td className="p-4 text-right font-black text-blue-600 text-base">
                    {s.nota !== null ? parseFloat(s.nota).toFixed(1) : 'Parcial'} / 10.0
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {submissoes.length === 0 && <p className="text-gray-500 italic p-6 text-center">Nenhuma prova foi realizada pelos alunos ainda.</p>}
        </div>
      )}
    </div>
  );
}