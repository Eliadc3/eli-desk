import { Request, Response, NextFunction } from "express";
import { Role } from "@prisma/client";
import { HttpError } from "../lib/httpError.js";

export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const user = (req as any).user as { role?: Role };
    if (!user?.role || !roles.includes(user.role)) {
      return next(new HttpError(403, "Forbidden"));
    }
    return next();
  };
}
