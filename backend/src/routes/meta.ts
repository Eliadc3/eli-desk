import { Router } from "express";
import { TicketPriority } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { userCtx } from "../lib/userCtx.js";
import { HttpError } from "../lib/httpError.js";
import { requireAuth } from "../middleware/requireAuth.js";

export const metaRouter = Router();

// ✅ חשוב: זה מה שחסר לך — מפענח את ה-JWT ומכניס req.user
metaRouter.use(requireAuth);

metaRouter.get("/ticket-statuses", async (req, res, next) => {
  try {
    const { orgId } = userCtx(req);
    if (!orgId) throw new HttpError(400, "Missing orgId");

    const items = await prisma.ticketStatus.findMany({
      where: { orgId, isActive: true },
      orderBy: [{ sortOrder: "asc" }, { labelHe: "asc" }],
      select: { id: true, key: true, labelHe: true, color: true, sortOrder: true, isDefault: true },
    });

    res.json({ items });
  } catch (e) {
    next(e);
  }
});

metaRouter.get("/ticket-priorities", (_req, res) => {
  res.json({ items: Object.values(TicketPriority) });
});

// Preview only (does NOT reserve / increment)
metaRouter.get("/ticket-next-number", async (_req, res, next) => {
  try {
    const c = await prisma.counter.findUnique({ where: { key: "ticketNumber" } });
    const nextNumber = c ? c.value + 1 : 1000;
    res.json({ number: nextNumber });
  } catch (e) {
    next(e);
  }
});
