import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";
import { HttpError } from "../lib/httpError.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../lib/auth.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { loginSchema } from "./schemas.js";

export const authRouter = Router();

authRouter.post("/login", async (req, res, next) => {
  try {
    const body = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: body.email }, include: { org: true } });
    if (!user) throw new HttpError(401, "Invalid credentials");
    const ok = await bcrypt.compare(body.password, user.passwordHash);
    if (!ok) throw new HttpError(401, "Invalid credentials");

    const payload = { sub: user.id, role: user.role, orgId: user.orgId ?? null };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    res.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role, orgId: user.orgId },
      accessToken,
      refreshToken,
    });
  } catch (e) {
    next(e);
  }
});

authRouter.post("/refresh", async (req, res, next) => {
  try {
    const token = req.body?.refreshToken;
    if (!token) throw new HttpError(400, "Missing refreshToken");
    const payload = verifyRefreshToken(token);
    // optionally check user still exists
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) throw new HttpError(401, "Invalid refreshToken");

    const newAccess = signAccessToken({ sub: user.id, role: user.role, orgId: user.orgId ?? null });
    res.json({ accessToken: newAccess });
  } catch (e) {
    next(e);
  }
});


// Current user profile (role, org, permissions)
authRouter.get("/me", requireAuth, async (req, res, next) => {
  try {
    const userCtx = (req as any).user as { sub: string };
    const user = await prisma.user.findUnique({
      where: { id: userCtx.sub },
      include: { permissions: true, techDepartment: true, org: true },
    });
    if (!user) throw new HttpError(401, "Invalid token");

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      orgId: user.orgId,
      techDepartment: user.techDepartment ? { id: user.techDepartment.id, name: user.techDepartment.name } : null,
      permissions: user.permissions.map((p) => p.perm),
    });
  } catch (e) {
    next(e);
  }
});
