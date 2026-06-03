import express from 'express';
// 1. Importamos o arquivo de rotas (Ajuste o caminho se o seu arquivo se chamar diferente)
import authRoutes from './routes/auth.routes.js'; 

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

// Iniciando o servidor
app.listen(PORT, () => {
  console.log(`\n=========================================`);
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`👉 Acesse: http://localhost:${PORT}`);
  console.log(`=========================================\n`);
});