import { HttpError } from "./httpError.js";
import type { Request } from "express";

export type AuthUser = {
  id: string;        // user id
  orgId?: string | null;
  role: "ADMIN" | "TECH" | "CUSTOMER"; // תתאים לשמות אצלך
};

export function userCtx(req: Request) {
  const u = (req as any).user as AuthUser | undefined;
  if (!u) throw new HttpError(401, "Unauthorized");
  return {
    sub: u.id,
    orgId: u.orgId ?? null,
    role: u.role,
  };
}
