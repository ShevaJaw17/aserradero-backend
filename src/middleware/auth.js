const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'aserradero-secret-change-me';

function sign(user) {
  return jwt.sign({ id: user.id, usuario: user.usuario, rol: user.rol, nombre: user.nombre }, SECRET, { expiresIn: '7d' });
}

function verifyToken(token) {
  try { return jwt.verify(token, SECRET); } catch { return null; }
}

function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  const payload = token ? verifyToken(token) : null;
  if (!payload) return res.status(401).json({ error: 'No autorizado' });
  req.user = payload;
  next();
}

module.exports = { sign, verifyToken, authMiddleware, SECRET };
