require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { authMiddleware } = require('./middleware/auth');
const authRoutes = require('./routes/auth');
const entityRouter = require('./routes/entity');

const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:8100').split(',').map((s) => s.trim());
app.use(helmet());
app.use(cors({ origin: (origin, cb) => (!origin || allowedOrigins.includes(origin)) ? cb(null, true) : cb(new Error('CORS bloqueado')), credentials: true }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'aserradero-backend' }));

app.use('/api/auth', authRoutes);

// protected entity routes
const collections = {
  troncos: 'troncos',
  produccion: 'produccion',
  pedidos: 'pedidos',
  facturas: 'facturas',
  mantenimientos: 'mantenimientos',
  operadores: 'operadores',
};

Object.entries(collections).forEach(([route, coll]) => {
  app.use(`/api/${route}`, authMiddleware, entityRouter(coll));
});

// bulk sync all collections at once
app.post('/api/sync', authMiddleware, (req, res) => {
  const db = require('./db');
  const body = req.body || {};
  const result = {};
  Object.entries(collections).forEach(([route, coll]) => {
    const items = Array.isArray(body[route]) ? body[route] : [];
    if (items.length) {
      const current = db.all(coll);
      const map = new Map(current.map((x) => [x.id, x]));
      items.forEach((it) => { if (it && it.id) map.set(it.id, { ...map.get(it.id), ...it, sincronizado: true }); });
      db.replaceAll(coll, Array.from(map.values()));
    }
    result[route] = db.all(coll).length;
  });
  res.json({ ok: true, totals: result });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Error interno' });
});

app.listen(PORT, () => console.log(`Aserradero backend listening on port ${PORT}`));
