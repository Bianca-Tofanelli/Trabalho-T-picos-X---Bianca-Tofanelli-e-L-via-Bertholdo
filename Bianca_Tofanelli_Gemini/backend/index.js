import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

// Permite que a API entenda requisições no formato JSON
app.use(express.json()); 

// Rota de teste simples para ver se o servidor está vivo
app.get('/', (req, res) => {
  res.json({ message: 'Servidor do Gerador de Quiz com Rubrica está rodando perfeitamente! 🚀' });
});

// Iniciando o servidor
app.listen(PORT, () => {
  console.log(`\n=========================================`);
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`👉 Acesse: http://localhost:${PORT}`);
  console.log(`=========================================\n`);
});
