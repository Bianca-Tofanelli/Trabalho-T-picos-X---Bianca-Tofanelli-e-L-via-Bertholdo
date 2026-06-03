// routes/report.routes.js
import express from 'express';
import { getQuizStatistics, downloadQuizResultsCSV } from '../controllers/report.controller.js';
import { authenticateToken, requireRole } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(authenticateToken);
router.use(requireRole('PROFESSOR'));

router.get('/quizzes/:quizId/stats', getQuizStatistics);
router.get('/quizzes/:quizId/export', downloadQuizResultsCSV);

export default router;