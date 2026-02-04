import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { env } from "./lib/env.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { requireAuth } from "./middleware/requireAuth.js";
import { requireRole } from "./middleware/requireRole.js";
import { Prisma , Role } from "@prisma/client";
import { authRouter } from "./routes/auth.js";
import { ticketsRouter } from "./routes/tickets.js";
import { adminRouter } from "./routes/admin.js";
import { departmentsRouter } from "./routes/departments.js";
import publicRouter  from "./routes/public.js";
import { dashboardRouter } from "./routes/dashboard.js";
import { metaRouter } from "./routes/meta.js";
import { bootstrapAppData } from "./bootsrap.js";

const app = express();

app.use(helmet());
// Support single origin or comma-separated list in CORS_ORIGIN
const allowedOrigins = String(env.CORS_ORIGIN)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      // Allow server-to-server requests with no Origin (e.g., curl, Prisma Studio hitting backend, etc.)
      if (!origin) return cb(null, true);
      if (allowedOrigins.length === 0) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "2mb" }));
app.use(morgan("dev"));
app.use(rateLimit({ windowMs: 60_000, limit: 120 }));

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/meta", metaRouter);

app.use("/auth", authRouter);

// Public routes (no auth)
app.use("/public", rateLimit({ windowMs: 60_000, limit: 30 }), publicRouter);

// Protected routes
app.use("/tickets", requireAuth, ticketsRouter);
app.use("/departments", requireAuth, departmentsRouter);
app.use("/dashboard", requireAuth, dashboardRouter);

// Admin routes
app.use("/admin", requireAuth, adminRouter);

app.use(errorHandler);

async function main() {
  await bootstrapAppData();

  app.listen(env.PORT, () => {
    console.log(`eli-desk-backend running on http://localhost:${env.PORT}`);
  });
}

main().catch((err) => {
  console.error("Fatal startup error:", err);
  process.exit(1);
});
