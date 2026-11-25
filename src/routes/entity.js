const express = require('express');

function entityRouter(collection) {
  const router = express.Router();
  const db = require('../db');

  router.get('/', (_req, res) => res.json(db.all(collection)));

  router.get('/:id', (req, res) => {
    const item = db.find(collection, req.params.id);
    if (!item) return res.status(404).json({ error: 'No encontrado' });
    res.json(item);
  });

  router.post('/', (req, res) => {
    const item = req.body;
    if (!item || !item.id) return res.status(400).json({ error: 'id requerido' });
    res.status(201).json(db.upsert(collection, item));
  });

  router.put('/:id', (req, res) => {
    const item = { ...req.body, id: req.params.id };
    res.json(db.upsert(collection, item));
  });

  router.delete('/:id', (req, res) => {
    db.remove(collection, req.params.id);
    res.status(204).send();
  });

  // bulk sync: replace collection with provided array (merge by id)
  router.post('/sync', (req, res) => {
    const items = Array.isArray(req.body) ? req.body : req.body.items || [];
    const current = db.all(collection);
    const map = new Map(current.map((x) => [x.id, x]));
    items.forEach((it) => { if (it && it.id) map.set(it.id, { ...map.get(it.id), ...it }); });
    const merged = Array.from(map.values());
    db.replaceAll(collection, merged);
    res.json({ received: items.length, total: merged.length });
  });

  return router;
}

module.exports = entityRouter;
