import express from 'express';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// ==========================================
// ROTA DE CADASTRO (REGISTER)
// ==========================================
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // 1. Verifica se o usuário já existe no banco
    const userExists = await prisma.user.findUnique({
      where: { email: email }
    });

    if (userExists) {
      return res.status(400).json({ message: 'Este email já está cadastrado.' });
    }

    // 2. Criptografa a senha (NUNCA salvamos a senha pura no banco!)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Salva o novo usuário no banco de dados
    // Agora aceita perfeitamente 'ALUNO', 'PROFESSOR' ou 'SECRETARIO'
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || 'ALUNO'
      }
    });

    // 4. Responde ao Frontend que deu tudo certo
    res.status(201).json({ 
      message: 'Usuário cadastrado com sucesso!',
      user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role }
    });

  } catch (error) {
    console.error("Erro no cadastro:", error);
    res.status(500).json({ message: 'Erro interno no servidor ao tentar cadastrar.' });
  }
});

// ==========================================
// ROTA DE LOGIN
// ==========================================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Busca o usuário pelo email
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: 'Email ou senha incorretos.' });
    }

    // 2. Compara a senha digitada com a senha criptografada do banco
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: 'Email ou senha incorretos.' });
    }

    // 3. Responde ao Frontend com os dados e o token
    res.status(200).json({
      message: 'Login realizado com sucesso!',
      token: 'token-simulado-para-teste-123', 
      user: { id: user.id, name: user.name, role: user.role }
    });

  } catch (error) {
    console.error("Erro no login:", error);
    res.status(500).json({ message: 'Erro interno no servidor ao tentar fazer login.' });
  }
});


// ==========================================
// ROTA EXCLUSIVA DA SECRETARIA (DASHBOARD)
// ==========================================
router.get('/secretario/dados', async (req, res) => {
  try {
    // 1. Busca todos os usuários cadastrados (sem trazer a senha por segurança)
    const usuarios = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true }
    });

    // 2. Busca todas as provas e inclui o nome do professor que a criou
    const provas = await prisma.quiz.findMany({
      include: {
        professor: { select: { name: true } } 
      }
    });

    // 3. Busca todas as submissões entregues para sabermos quem fez o quê
    const submissoes = await prisma.submission.findMany({
      include: {
        student: { select: { name: true } },
        quiz: { select: { title: true } }
      }
    });

    res.json({ usuarios, provas, submissoes });
  } catch (error) {
    console.error("Erro ao buscar dados da secretaria:", error);
    res.status(500).json({ error: 'Erro interno ao carregar dados da secretaria.' });
  }
});


// ==========================================
// ROTA PARA EXCLUIR CONTA DE USUÁRIO
// ==========================================
router.delete('/usuario/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });

    if (user.role === 'ALUNO') {
      // Se for aluno, apaga as entregas dele
      await prisma.submission.deleteMany({ where: { studentId: userId } });
      
    } else if (user.role === 'PROFESSOR') {
      // Se for professor, a limpeza precisa seguir a hierarquia do banco
      const provas = await prisma.quiz.findMany({ where: { professorId: userId } });
      const idsProvas = provas.map(p => p.id);

      if (idsProvas.length > 0) {
        // 1. Apaga as entregas dos alunos referentes a essas provas
        await prisma.submission.deleteMany({ where: { quizId: { in: idsProvas } } });
        
        // 2. Busca todas as questões que pertencem a essas provas
        const questoes = await prisma.question.findMany({
          where: { quizzes: { some: { quizId: { in: idsProvas } } } }
        });
        const idsQuestoes = questoes.map(q => q.id);

        // 3. Quebra a ponte que liga as Questões à Prova (tabela QuizQuestion)
        await prisma.quizQuestion.deleteMany({ where: { quizId: { in: idsProvas } } });

        // 4. Apaga as questões definitivamente
        if (idsQuestoes.length > 0) {
          await prisma.question.deleteMany({ where: { id: { in: idsQuestoes } } });
        }
      }
      
      // 5. Com a caixa vazia, apaga as provas!
      await prisma.quiz.deleteMany({ where: { professorId: userId } });
      
    } else if (user.role === 'SECRETARIO') {
      // O Secretário não tem provas atreladas a ele, então não precisamos limpar tabelas filhas.
      // O código simplesmente passa direto para a exclusão do usuário abaixo.
      console.log(`Excluindo conta de Secretário: ID ${userId}`);
    }

    // Por fim, apaga a conta do usuário
    await prisma.user.delete({ where: { id: userId } });

    res.json({ message: 'Conta e todos os dados excluídos com sucesso!' });
  } catch (error) {
    console.error("Erro ao excluir conta:", error);
    res.status(500).json({ error: 'Erro ao excluir a conta.' });
  }
});

export default router;