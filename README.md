# ResidenciasPro

Software de administración de conjuntos residenciales.
Stack: React + Vite · Node.js/Express · PostgreSQL

---

## Estructura

```
residenciaspro/
├── frontend/          ← React app (Vite)
│   └── src/
│       ├── pages/     ← Dashboard, Residentes, Cuotas, Reportes, Comunicados, PQR, Login
│       ├── components/← layout/ y ui/ reutilizables
│       ├── store/     ← Zustand (appStore, authStore)
│       └── utils/     ← pdf.js
└── backend/           ← API REST Express
    ├── public/        ← Build de React (generado automáticamente)
    └── src/
        ├── routes/    ← /api/auth
        ├── migrations/← SQL versionado
        └── seeders/   ← Datos de prueba
```

---

## Inicio rápido

### 1. Base de datos
```bash
cd backend
cp .env.example .env   # editar con tus credenciales de PostgreSQL
npm install
npm run migrate
npm run seed
```

### 2. Desarrollo (hot-reload React)
```bash
# Terminal 1 — backend
cd backend && npm run dev

# Terminal 2 — frontend
cd frontend && npm run dev
# Abre: http://localhost:5173
```

### 3. Producción (un solo proceso)
```bash
cd frontend && npm run build   # genera backend/public/
cd ../backend && npm start
# Abre: http://localhost:3000
```

---

## Credenciales de prueba
- Email: `admin@bellohorizonte.co`
- Contraseña: `Admin2025!`
