import { Router } from "express";
import { TicketStatus, TicketPriority } from "@prisma/client";

export const metaRouter = Router();

metaRouter.get("/ticket-statuses", (_req, res) => {
  res.json({ items: Object.values(TicketStatus) });
});

metaRouter.get("/ticket-priorities", (_req, res) => {
  res.json({ items: Object.values(TicketPriority) });
});
