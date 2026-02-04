import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { HttpError } from "../lib/httpError.js";

export function errorHandler(err: any, _req: any, res: any, _next: any) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({
      error: err.message,
      details: (err as any).details ?? null,
    });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      error: "Validation error",
      details: err.flatten(),
    });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      return res.status(409).json({
        error: "Unique constraint failed",
        details: err.meta ?? null,
      });
    }

    if (err.code === "P2003") {
      return res.status(400).json({
        error: "Invalid reference (foreign key)",
        details: err.meta ?? null,
      });
    }
  }

  console.error(err);
  return res.status(500).json({ error: "Internal server error" });
}
