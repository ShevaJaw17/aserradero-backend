const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { sign } = require('../middleware/auth');
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

module.exports = router;
