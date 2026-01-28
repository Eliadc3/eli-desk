import { Router } from "express";
import { TicketStatus, TicketPriority } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

export const metaRouter = Router();

metaRouter.get("/ticket-statuses", (_req, res) => {
  res.json({ items: Object.values(TicketStatus) });
});

metaRouter.get("/ticket-priorities", (_req, res) => {
  res.json({ items: Object.values(TicketPriority) });
});

// Preview only (does NOT reserve / increment)
// Used for the internal "new ticket" screen so Cancel doesn't consume numbers.
metaRouter.get("/ticket-next-number", async (_req, res, next) => {
  try {
    const c = await prisma.counter.findUnique({ where: { key: "ticketNumber" } });
    // First created ticket number is 1000 (see create endpoints)
    const nextNumber = c ? c.value + 1 : 1000;
    res.json({ number: nextNumber });
  } catch (e) {
    next(e);
  }
});
