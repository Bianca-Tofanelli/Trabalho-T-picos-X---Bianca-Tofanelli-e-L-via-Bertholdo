// routes/quiz.routes.js
import express from 'express';
import { createQuiz } from '../controllers/quiz.controller.js';
import { authenticateToken, requireRole } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Middleware global para este grupo de rotas
router.use(authenticateToken);
router.use(requireRole('PROFESSOR'));

// Rota para criação do Quiz
router.post('/', createQuiz);

export default router;