# eli-desk-backend

Backend minimal for Eli-Desk: Auth (JWT), RBAC, Tickets (open/closed), Resolution fields, Demo seed/reset, Label printing endpoint.

## Requirements
- Node 18+ (recommended 20)
- npm

## Setup

1) Install deps:
```bash
npm install
```

2) Create .env:
```bash
cp .env.example .env
```

3) Init DB (SQLite) + seed:
```bash
npm run prisma:migrate
npm run seed
```

4) Run:
```bash
npm run dev
```

## Login demo users
- Admin: admin@eli-desk.local / admin1234
- Tech:  tech1@eli-desk.local / tech1234
- Cust:  customer@eli-desk.local / cust1234

## API quick
- POST /auth/login {email,password} -> accessToken
- GET /tickets?status=all|new|closed...
- POST /tickets
- PATCH /tickets/:id (resolutionSummary required when resolving/closing)
- GET /label/:id?size=a6|small (HTML print page)
- POST /demo/reset (Admin)
- POST /demo/seed?count=50 (Admin)

## Public ticket (no login)
- POST /public/tickets {subject,description,priority?,name?,email?,phone?,orgId?}

## Admin (SUPER_ADMIN/ADMIN or permissions)
- /admin/departments
- /admin/technicians
- /admin/tickets/:id/reassign|duplicate|delete
