import dotenv from "dotenv";
dotenv.config();

export const env = {
  PORT: Number(process.env.PORT ?? 3001),
  DATABASE_URL: process.env.DATABASE_URL ?? "file:./dev.db",
  // Backward compatible: if someone set JWT_SECRET, use it for access.
  JWT_ACCESS_SECRET:
    process.env.JWT_ACCESS_SECRET ?? process.env.JWT_SECRET ?? "change-me-access",
  JWT_REFRESH_SECRET:
    process.env.JWT_REFRESH_SECRET ?? process.env.JWT_SECRET ?? "change-me-refresh",
  // Comma-separated list or single origin
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? "http://localhost:5173",
  PUBLIC_FORM_ORG_ID: process.env.PUBLIC_FORM_ORG_ID ?? "demo-org",
};
