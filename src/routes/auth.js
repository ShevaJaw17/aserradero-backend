const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { sign, verifyToken } = require('../middleware/auth');
const router = express.Router();

router.post('/login', (req, res) => {
  const { usuario, password } = req.body || {};
  const user = db.all('users').find((u) => u.usuario === usuario);
  if (!user || !bcrypt.compareSync(password || '', user.password)) {
    return res.status(401).json({ error: 'Credenciales invalidas' });
  }
  const { password: _p, ...safe } = user;
  res.json({ token: sign(safe), user: safe });
});

router.get('/me', (req, res) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  const payload = token ? verifyToken(token) : null;
  if (!payload) return res.status(401).json({ error: 'No autorizado' });
  const user = db.all('users').find((u) => u.id === payload.id);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
  const { password: _p, ...safe } = user;
  res.json({ user: safe });
});

module.exports = router;
