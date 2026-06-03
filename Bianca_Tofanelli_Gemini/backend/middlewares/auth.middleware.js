// middlewares/auth.middleware.js
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'chave-super-secreta-em-producao';

// 1. Verifica se o usuário está logado (Token válido)
export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Formato: "Bearer <token>"

  if (!token) return res.status(401).json({ error: 'Acesso negado. Token não fornecido.' });

  jwt.verify(token, JWT_SECRET, (err, decodedPayload) => {
    if (err) return res.status(403).json({ error: 'Token inválido ou expirado.' });
    
    // Injeta os dados do usuário na requisição para as próximas etapas
    req.user = decodedPayload; 
    next();
  });
}

// 2. Factory function para criar guardiões de rotas específicos
export function requireRole(requiredRole) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== requiredRole) {
      return res.status(403).json({ error: 'Acesso restrito: permissão insuficiente.' });
    }
    next();
  };
}