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

    // 3. Salva o novo usuário no banco de dados (SQLite)
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

    // 3. Responde ao Frontend com os dados e um token simulado (para o login funcionar agora)
    res.status(200).json({
      message: 'Login realizado com sucesso!',
      token: 'token-simulado-para-teste-123', // Mais para frente você pode adicionar o JWT real aqui
      user: { id: user.id, name: user.name, role: user.role }
    });

  } catch (error) {
    console.error("Erro no login:", error);
    res.status(500).json({ message: 'Erro interno no servidor ao tentar fazer login.' });
  }
});

export default router;