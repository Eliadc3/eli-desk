import { Request, Response, NextFunction } from "express";
import { HttpError } from "../lib/httpError.js";
import { verifyAccessToken } from "../lib/auth.js";

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next(new HttpError(401, "Missing Bearer token"));
  }
  const token = header.slice("Bearer ".length);
  try {
    const payload = verifyAccessToken(token);
    (req as any).user = payload;
    return next();
  } catch {
    return next(new HttpError(401, "Invalid/expired token"));
  }
}
