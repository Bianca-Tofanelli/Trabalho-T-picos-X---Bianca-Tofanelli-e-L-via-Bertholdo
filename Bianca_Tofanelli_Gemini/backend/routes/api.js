// routes/api.js
import express from 'express';
import { register, login } from '../controllers/auth.controller.js';
import { authenticateToken, requireRole } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Rotas Abertas (Públicas)
router.post('/register', register);
router.post('/login', login);

// Rotas de Professor (Exigem login E role 'PROFESSOR')
router.post(
  '/quizzes', 
  authenticateToken, 
  requireRole('PROFESSOR'), 
  (req, res) => {
    // O req.user.userId contém o ID do professor para ser salvo no banco
    res.json({ message: 'Acesso concedido: Criando um novo Quiz.' });
  }
);

// Rotas de Aluno (Exigem login E role 'ALUNO')
router.post(
  '/submissions', 
  authenticateToken, 
  requireRole('ALUNO'), 
  (req, res) => {
    res.json({ message: 'Acesso concedido: Recebendo a submissão do aluno.' });
  }
);

export default router;