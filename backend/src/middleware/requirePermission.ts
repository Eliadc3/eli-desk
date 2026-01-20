import { Request, Response, NextFunction } from "express";
import { HttpError } from "../lib/httpError.js";
import { prisma } from "../lib/prisma.js";
import { Permission, Role } from "@prisma/client";

export function requirePermission(perm: Permission) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    const user = (req as any).user as { sub: string; role: Role };
    if (!user?.sub) return next(new HttpError(401, "Missing auth context"));

    if (user.role === "SUPER_ADMIN" || user.role === "ADMIN") return next();

    const found = await prisma.userPermission.findUnique({
      where: { userId_perm: { userId: user.sub, perm } },
    });
    if (!found) return next(new HttpError(403, "Missing permission"));
    return next();
  };
}
