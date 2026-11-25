const express = require('express');
const db = require('../db');
const { requireRole } = require('../middleware/auth');

const READ_ROLES = ['operador', 'jefe', 'admin'];
const WRITE_ROLES = ['operador', 'jefe', 'admin'];
const DELETE_ROLES = ['jefe', 'admin'];

function audit(user, action, collection, id, detail) {
  try {
    const list = db.all('audit');
    list.unshift({ id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, fecha: new Date().toISOString(), usuario: user.usuario, rol: user.rol, accion: action, coleccion: collection, registro: id, detalle: detail || null });
    db.replaceAll('audit', list.slice(0, 1000));
  } catch (_e) {}
}

function entityRouter(collection) {
  const router = express.Router();

  router.get('/', requireRole(...READ_ROLES), (_req, res) => res.json(db.all(collection)));

  router.get('/:id', requireRole(...READ_ROLES), (req, res) => {
    const item = db.find(collection, req.params.id);
    if (!item) return res.status(404).json({ error: 'No encontrado' });
    res.json(item);
  });

  router.post('/', requireRole(...WRITE_ROLES), (req, res) => {
    const item = req.body;
    if (!item || typeof item !== 'object' || Array.isArray(item) || !item.id) {
      return res.status(400).json({ error: 'id requerido' });
    }
    const saved = db.upsert(collection, item);
    audit(req.user, 'crear', collection, item.id, null);
    res.status(201).json(saved);
  });

  router.put('/:id', requireRole(...WRITE_ROLES), (req, res) => {
    const item = { ...req.body, id: req.params.id };
    if (!item.id) return res.status(400).json({ error: 'id requerido' });
    const saved = db.upsert(collection, item);
    audit(req.user, 'actualizar', collection, req.params.id, null);
    res.json(saved);
  });

  router.delete('/:id', requireRole(...DELETE_ROLES), (req, res) => {
    db.remove(collection, req.params.id);
    audit(req.user, 'eliminar', collection, req.params.id, null);
    res.status(204).send();
  });

  router.post('/sync', requireRole(...WRITE_ROLES), (req, res) => {
    const items = Array.isArray(req.body) ? req.body : (req.body && req.body.items) || [];
    if (!Array.isArray(items)) return res.status(400).json({ error: 'items invalidos' });
    const current = db.all(collection);
    const map = new Map(current.map((x) => [x.id, x]));
    items.forEach((it) => { if (it && it.id) map.set(it.id, { ...map.get(it.id), ...it }); });
    const merged = Array.from(map.values());
    db.replaceAll(collection, merged);
    audit(req.user, 'sync', collection, null, `${items.length} recibidos`);
    res.json({ received: items.length, total: merged.length });
  });

  return router;
}

module.exports = entityRouter;