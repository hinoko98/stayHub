# HotelCompleto

Proyecto nuevo que integra:

- portal publico de usuario para buscar moteles y reservar
- control interno por motel para habitaciones, reservas y perfil del establecimiento
- base de datos local con `SQLite`
- `Express + Prisma` en backend
- `React + MUI + Tailwind` en frontend

## Estructura

- `backend/`: API REST y Prisma
- `frontend/`: app React con portal publico de moteles y panel interno
- `database/`: archivo SQLite local y notas de base de datos

## Inicio rapido

```bash
npm install
cd backend && npm install
cd ../frontend && npm install
cd ..
npm run db:push
npm run db:seed
npm run dev
```

Servicios:

- Frontend: `http://localhost:5173`
- API: `http://localhost:4000`
