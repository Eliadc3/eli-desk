import { Router } from "express";
import { Permission } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { HttpError } from "../../lib/httpError.js";
import { requirePermission } from "../../middleware/requirePermission.js";

export const adminTicketActionsRouter = Router();

adminTicketActionsRouter.post(
  "/tickets/:id/reassign",
  requirePermission(Permission.TICKET_REASSIGN),
  async (req, res, next) => {
    try {
      const id = req.params.id;
      const { assigneeId } = req.body ?? {};
      if (!assigneeId) throw new HttpError(400, "Missing assigneeId");

      const t = await prisma.ticket.update({ where: { id }, data: { assigneeId } });

      await prisma.ticketActivity.create({
        data: {
          ticketId: id,
          actorId: (req as any).user.sub,
          type: "reassign",
          message: "Ticket reassigned",
          metaJson: JSON.stringify({ assigneeId }),
        },
      });

      res.json(t);
    } catch (e) {
      next(e);
    }
  }
);

adminTicketActionsRouter.post(
  "/tickets/:id/duplicate",
  requirePermission(Permission.TICKET_DUPLICATE),
  async (req, res, next) => {
    try {
      const id = req.params.id;
      const orig = await prisma.ticket.findUnique({ where: { id } });
      if (!orig) throw new HttpError(404, "Ticket not found");

      const c = await prisma.counter.upsert({
        where: { key: "ticketNumber" },
        update: { value: { increment: 1 } },
        create: { key: "ticketNumber", value: 1000 },
      });

      const copy = await prisma.ticket.create({
        data: {
          number: c.value,
          subject: `[COPY] ${orig.subject}`,
          description: orig.description,
          statusId: orig.statusId,
          priority: orig.priority,
          orgId: orig.orgId,
          assigneeId: orig.assigneeId,
          source: orig.source,
          externalRequesterName: orig.externalRequesterName,
          externalRequesterPhone: orig.externalRequesterPhone,
          hospitalDepartmentId: orig.hospitalDepartmentId,
        },
      });

      await prisma.ticketActivity.create({
        data: {
          ticketId: copy.id,
          actorId: (req as any).user.sub,
          type: "duplicate",
          message: `Duplicated from #${orig.number}`,
          metaJson: JSON.stringify({ from: orig.id }),
        },
      });

      res.status(201).json(copy);
    } catch (e) {
      next(e);
    }
  }
);

adminTicketActionsRouter.delete(
  "/tickets/:id",
  requirePermission(Permission.TICKET_DELETE),
  async (req, res, next) => {
    try {
      const id = req.params.id;
      await prisma.ticketActivity.deleteMany({ where: { ticketId: id } });
      await prisma.ticket.delete({ where: { id } });
      res.json({ ok: true });
    } catch (e) {
      next(e);
    }
  }
);
