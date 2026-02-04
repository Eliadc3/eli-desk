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
  APP_ORG_ID: process.env.APP_ORG_ID ?? "app-org",
  ADMIN_USERNAME: process.env.ADMIN_USERNAME,
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
};
