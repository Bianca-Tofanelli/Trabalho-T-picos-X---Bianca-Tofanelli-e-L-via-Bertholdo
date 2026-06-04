import express from 'express';
// 1. Importamos o arquivo de rotas (Ajuste o caminho se o seu arquivo se chamar diferente)
import authRoutes from './routes/auth.routes.js'; 
import quizRoutes from './routes/quiz.routes.js'; // <-- 1. ADICIONEI ESTA LINHA AQUI!

const app = express();
const PORT = process.env.PORT || 3000;

// Permite que a API entenda requisições no formato JSON
app.use(express.json()); 

// Rota de teste simples para ver se o servidor está vivo
app.get('/', (req, res) => {
  res.json({ message: 'Servidor do Gerador de Quiz com Rubrica está rodando perfeitamente! 🚀' });
});

// 👇 2. O SEGREDO QUE FALTAVA 👇
// Toda vez que chegar um pedido começando com /api/auth, ele manda para o authRoutes
app.use('/api/auth', authRoutes);

// 👇 2. ADICIONEI ESTA LINHA TAMBÉM 👇
// Toda vez que chegar um pedido começando com /api/quizzes, ele manda para o quizRoutes
app.use('/api/quizzes', quizRoutes);

// Iniciando o servidor
app.listen(PORT, () => {
  console.log(`\n=========================================`);
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`👉 Acesse: http://localhost:${PORT}`);
  console.log(`=========================================\n`);
});