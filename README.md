# Aserradero Backend (REST)

API REST en Node.js/Express para la app móvil del aserradero. Almacenamiento en archivos JSON (fácil de migrar a PostgreSQL/MongoDB).

## Ejecutar

```bash
npm install
npm start          # puerto 3000 (o PORT=...)
```

## Endpoints

- `POST /api/auth/login` — {usuario, password} → {token, user}
- `GET/POST/PUT/DELETE /api/troncos` (y produccion, pedidos, facturas, mantenimientos)
- `POST /api/sync` — sincronización masiva (requiere Bearer token)

## Variables de entorno

- `PORT` (default 3000)
- `JWT_SECRET` (cambiar en producción)
