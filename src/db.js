const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const collections = ['troncos', 'produccion', 'pedidos', 'facturas', 'mantenimientos', 'users'];

function filePath(name) {
  return path.join(DATA_DIR, name + '.json');
}

function load(name) {
  const f = filePath(name);
  if (!fs.existsSync(f)) return [];
  try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return []; }
}

function save(name, data) {
  fs.writeFileSync(filePath(name), JSON.stringify(data, null, 2));
}

function ensureSeed() {
  // seed users
  let users = load('users');
  if (users.length === 0) {
    const bcrypt = require('bcryptjs');
    users = [
      { id: 'operador', nombre: 'Operador Demo', usuario: 'operador', password: bcrypt.hashSync('operador', 10), rol: 'operador' },
      { id: 'jefe', nombre: 'Jefe de Planta', usuario: 'jefe', password: bcrypt.hashSync('jefe', 10), rol: 'jefe' },
      { id: 'admin', nombre: 'Administrador', usuario: 'admin', password: bcrypt.hashSync('admin', 10), rol: 'admin' },
    ];
    save('users', users);
  }
  collections.forEach((c) => { if (c !== 'users') load(c); if (!fs.existsSync(filePath(c))) save(c, []); });
}

ensureSeed();

module.exports = {
  all: (name) => load(name),
  find: (name, id) => load(name).find((x) => x.id === id),
  upsert: (name, item) => {
    const list = load(name);
    const idx = list.findIndex((x) => x.id === item.id);
    if (idx >= 0) list[idx] = { ...list[idx], ...item };
    else list.unshift(item);
    save(name, list);
    return item;
  },
  remove: (name, id) => {
    const list = load(name).filter((x) => x.id !== id);
    save(name, list);
    return true;
  },
  replaceAll: (name, items) => {
    save(name, items);
    return items;
  },
};
