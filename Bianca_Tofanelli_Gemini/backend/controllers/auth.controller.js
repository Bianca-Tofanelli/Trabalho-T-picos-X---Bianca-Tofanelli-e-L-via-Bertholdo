// controllers/auth.controller.js
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'chave-super-secreta-em-producao';

export async function register(req, res) {
  const { name, email, password, role } = req.body;

  try {
    // Hasheando a senha com custo 10
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { name, email, passwordHash, role }
    });

    return res.status(201).json({ message: 'Usuário registrado com sucesso!' });
  } catch (error) {
    return res.status(400).json({ error: 'Erro ao criar usuário. O email pode já estar em uso.' });
  }
}

export async function login(req, res) {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: 'Credenciais inválidas.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    // O payload do JWT embute o ID e a Role do usuário
    const token = jwt.sign(
      { userId: user.id, role: user.role }, 
      JWT_SECRET, 
      { expiresIn: '8h' }
    );

    return res.json({ token, role: user.role });
  } catch (error) {
    return res.status(500).json({ error: 'Erro interno do servidor.' });
  }
}