import express from 'express';
import cors from 'cors';
// Importamos os arquivos de rotas
import authRoutes from './routes/auth.routes.js'; 
import quizRoutes from './routes/quiz.routes.js'; 
import reportRoutes from './routes/report.routes.js'; // 👈 1. NOVO: Importamos a rota de relatórios

const app = express();
const PORT = process.env.PORT || 3000;

// Permite que a API entenda requisições no formato JSON
app.use(cors());
app.use(express.json()); 

// Rota de teste simples para ver se o servidor está vivo
app.get('/', (req, res) => {
  res.json({ message: 'Servidor do Gerador de Quiz com Rubrica está rodando perfeitamente! 🚀' });
});

// Toda vez que chegar um pedido começando com /api/auth, ele manda para o authRoutes
app.use('/api/auth', authRoutes);

// Toda vez que chegar um pedido começando com /api/quizzes, ele manda para o quizRoutes
app.use('/api/quizzes', quizRoutes);

// 👇 2. NOVO: Toda vez que chegar um pedido de relatório, ele manda para o reportRoutes 👇
app.use('/api/reports', reportRoutes);

// Iniciando o servidor
app.listen(PORT, () => {
  console.log(`\n=========================================`);
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`👉 Acesse: http://localhost:${PORT}`);
  console.log(`=========================================\n`);
});