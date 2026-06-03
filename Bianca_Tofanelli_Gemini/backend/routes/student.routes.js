// routes/student.routes.js
import express from 'express';
import { getDashboard, startQuiz, submitQuiz } from '../controllers/student.controller.js';
import { authenticateToken, requireRole } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(authenticateToken);
router.use(requireRole('ALUNO'));

router.get('/dashboard', getDashboard);
router.post('/quizzes/:quizId/start', startQuiz);
router.post('/quizzes/:quizId/submit', submitQuiz);

export default router;