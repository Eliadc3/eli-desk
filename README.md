# eli-desk (backend + frontend)

This repo contains:
- **backend**: Express + Prisma (SQLite) + JWT auth + RBAC + tickets + admin endpoints
- **frontend**: React (Vite) + shadcn UI – full app UI including **Admin screens** (visible only to Admin)

## Quick start (local)

### Option A — one-time setup + run (recommended)
From the repo root:

```bash
npm run setup
npm run dev
```

What it does:
- installs deps in **backend** and **frontend**
- runs Prisma generate + migrate + seed
- starts backend (port **3001**) and frontend (port **5173** by default)

### Option B — two terminals (more explicit)
**Terminal 1 (backend):**
```bash
cd backend
cp .env.example .env   # first time only
npm install
npm run prisma:generate
npm run prisma:migrate
npm run seed
npm run dev
```

**Terminal 2 (frontend):**
```bash
cd frontend
cp .env.example .env   # first time only
npm install
npm run dev
```

## Default URLs
- Frontend: `http://localhost:5173`
- Backend:  `http://localhost:3001`
- Health check: `http://localhost:3001/health`

## Demo users (seed)
- Admin: `admin@eli-desk.local` / `admin1234`
- Tech:  `tech1@eli-desk.local` / `tech1234`
- Cust:  `customer@eli-desk.local` / `cust1234`

## CORS note (important)
Backend reads `CORS_ORIGIN` from `backend/.env`.
It supports **a single origin** or **comma-separated list**, e.g.:

```env
CORS_ORIGIN="http://localhost:5173,http://localhost:8080"
```

If you run the frontend on a different port/origin, update this value and restart the backend.
