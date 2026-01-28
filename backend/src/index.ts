import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { env } from "./lib/env.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { requireAuth } from "./middleware/requireAuth.js";
import { requireRole } from "./middleware/requireRole.js";
import { Role } from "@prisma/client";
import { authRouter } from "./routes/auth.js";
import { ticketsRouter } from "./routes/tickets.js";
import { demoRouter } from "./routes/demo.js";
import { adminRouter } from "./routes/admin.js";
import { departmentsRouter } from "./routes/departments.js";
import { publicRouter } from "./routes/public.js";
import { dashboardRouter } from "./routes/dashboard.js";
import { metaRouter } from "./routes/meta.js";



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

// Admin-only demo endpoints
app.use("/demo", requireAuth, requireRole(Role.ADMIN), demoRouter);

app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`eli-desk-backend running on http://localhost:${env.PORT}`);
});


import { ZodError } from "zod";
import { HttpError } from "./lib/httpError.js";

app.use((err: any, req: any, res: any, next: any) => {
  // Zod validation errors -> 400 with details
  if (err instanceof ZodError) {
    const issues = err.issues.map(i => ({
      path: i.path.join("."),
      message: i.message,
    }));

    return res.status(400).json({
      message: issues.map(x => `${x.path}: ${x.message}`).join(" | "),
      code: "VALIDATION_ERROR",
      issues,
    });
  }

  // Your typed HTTP errors
  if (err instanceof HttpError) {
    return res.status(err.status).json({
      message: err.message,
      code: "HTTP_ERROR",
    });
  }

  // Prisma common case (optional but useful)
  if (err?.name === "PrismaClientKnownRequestError") {
    return res.status(400).json({
      message: err.message,
      code: "PRISMA_ERROR",
    });
  }

  console.error(err);
  return res.status(500).json({
    message: "Internal Server Error",
    code: "INTERNAL_SERVER_ERROR",
  });
});
