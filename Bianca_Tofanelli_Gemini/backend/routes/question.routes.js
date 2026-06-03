// routes/question.routes.js
import express from 'express';
import { createQuestion, listQuestions, updateQuestion, deleteQuestion } from '../controllers/question.controller.js';
import { authenticateToken, requireRole } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Aplica autenticação e restrição de papel globalmente para todas as rotas deste arquivo
router.use(authenticateToken);
router.use(requireRole('PROFESSOR'));

router.post('/', createQuestion);
router.get('/', listQuestions);
router.put('/:id', updateQuestion);
router.delete('/:id', deleteQuestion);

export default router;