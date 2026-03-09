import { Router } from "express";
import { Permission, Role, TicketSource } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { HttpError } from "../lib/httpError.js";
import { userCtx } from "../lib/userCtx.js";
import { requirePermission } from "../middleware/requirePermission.js";
import { ticketCreateSchema, ticketPatchSchema } from "./schemas.js";

export const ticketsRouter = Router();

async function nextTicketNumber() {
  const c = await prisma.counter.upsert({
    where: { key: "ticketNumber" },
    create: { key: "ticketNumber", value: 1000 },
    update: { value: { increment: 1 } },
  });
  return c.value;
}

async function getStatusKeyById(statusId?: string | null) {
  if (!statusId) return null;
  const status = await prisma.ticketStatus.findFirst({
    where: { id: statusId },
    select: { key: true },
  });
  if (!status) throw new HttpError(400, "Invalid statusId");
  return String(status.key).toUpperCase();
}

ticketsRouter.get("/", async (req, res, next) => {
  try {
    const { role, orgId } = userCtx(req);

    const statusId = String(req.query.statusId ?? "");
    const statusKey = String(req.query.status ?? "").trim().toUpperCase();
    const page = Math.max(1, Number(req.query.page ?? 1));
    const pageSize = Math.min(50, Math.max(5, Number(req.query.pageSize ?? 20)));
    const skip = (page - 1) * pageSize;

    const where: any = {};

    if (role === Role.CUSTOMER) {
      if (!orgId) throw new HttpError(403, "Customer missing orgId");
      where.orgId = orgId;
    }

    if (statusId) {
      where.statusId = statusId;
    } else if (statusKey && statusKey !== "ALL") {
      where.status = {
        key: statusKey,
      };
    }

    const [items, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
        include: {
          requester: { select: { id: true, name: true } },
          hospitalDepartment: { select: { id: true, name: true, type: true } },
          assignee: { select: { id: true, name: true } },
          status: { select: { id: true, key: true, labelHe: true, color: true } },
        },
      }),
      prisma.ticket.count({ where }),
    ]);

    res.json({ items, total, page, pageSize });
  } catch (e) {
    next(e);
  }
});

ticketsRouter.get("/assignees", async (req, res, next) => {
  try {
    const { orgId } = userCtx(req);

    const items = await prisma.user.findMany({
      where: {
        isActive: true,
        role: { in: [Role.TECHNICIAN, Role.ADMIN] },
        ...(orgId ? { OR: [{ orgId }, { orgId: null }] } : {}),
      },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    });

    res.json({ items });
  } catch (e) {
    next(e);
  }
});

ticketsRouter.patch("/bulk", async (req, res, next) => {
  try {
    const { role, orgId, sub } = userCtx(req);
    const { ticketIds, statusId, assigneeId, priority } = req.body as {
      ticketIds?: string[];
      statusId?: string;
      assigneeId?: string | null;
      priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    };

    if (!Array.isArray(ticketIds) || ticketIds.length === 0) {
      throw new HttpError(400, "יש לבחור לפחות קריאה אחת");
    }

    if (role === Role.CUSTOMER) {
      throw new HttpError(403, "Customers cannot bulk update tickets");
    }

    const where: any = { id: { in: ticketIds } };
    if (role === Role.CUSTOMER && orgId) where.orgId = orgId;

    const data: Record<string, any> = {};
    const activityKeys: string[] = [];

    if (statusId) {
      const nextStatusKey = await getStatusKeyById(statusId);
      if (nextStatusKey === "CLOSED") {
        throw new HttpError(400, "Bulk close is not allowed");
      }
      data.statusId = statusId;
      activityKeys.push("statusId");

      if (nextStatusKey === "RESOLVED") {
        data.resolvedAt = new Date();
        data.resolvedById = sub;
      }
    }

    if (typeof assigneeId !== "undefined") {
      data.assigneeId = assigneeId;
      activityKeys.push("assigneeId");
    }

    if (priority) {
      data.priority = priority;
      activityKeys.push("priority");
    }

    if (Object.keys(data).length === 0) {
      throw new HttpError(400, "לא נשלחו שדות לעדכון");
    }

    const allowedTickets = await prisma.ticket.findMany({
      where,
      select: { id: true, resolvedAt: true, resolvedById: true },
    });

    if (!allowedTickets.length) {
      throw new HttpError(404, "Tickets not found");
    }

    await prisma.$transaction(async (tx) => {
      if (statusId && data.resolvedAt) {
        const unresolvedIds = allowedTickets
          .filter((ticket) => !ticket.resolvedAt && !ticket.resolvedById)
          .map((ticket) => ticket.id);

        if (unresolvedIds.length) {
          await tx.ticket.updateMany({
            where: { id: { in: unresolvedIds } },
            data,
          });
        }

        const alreadyResolvedIds = allowedTickets
          .filter((ticket) => ticket.resolvedAt || ticket.resolvedById)
          .map((ticket) => ticket.id);

        if (alreadyResolvedIds.length) {
          const resolvedData = { ...data };
          delete resolvedData.resolvedAt;
          delete resolvedData.resolvedById;
          await tx.ticket.updateMany({
            where: { id: { in: alreadyResolvedIds } },
            data: resolvedData,
          });
        }
      } else {
        await tx.ticket.updateMany({
          where: { id: { in: allowedTickets.map((ticket) => ticket.id) } },
          data,
        });
      }

      await tx.ticketActivity.createMany({
        data: allowedTickets.map((ticket) => ({
          ticketId: ticket.id,
          actorId: sub,
          type: "updated",
          message: "Bulk ticket update",
          metaJson: JSON.stringify({ keys: activityKeys, bulk: true }),
        })),
      });
    });

    res.json({ ok: true, updatedCount: allowedTickets.length });
  } catch (e) {
    next(e);
  }
});

ticketsRouter.delete("/bulk", requirePermission(Permission.TICKET_DELETE), async (req, res, next) => {
  try {
    const { role, orgId } = userCtx(req);
    const { ticketIds } = req.body as { ticketIds?: string[] };

    if (!Array.isArray(ticketIds) || ticketIds.length === 0) {
      throw new HttpError(400, "יש לבחור לפחות קריאה אחת");
    }

    const where: any = { id: { in: ticketIds } };
    if (role === Role.CUSTOMER) {
      if (!orgId) throw new HttpError(403, "Customer missing orgId");
      where.orgId = orgId;
    }

    const tickets = await prisma.ticket.findMany({ where, select: { id: true } });
    if (!tickets.length) throw new HttpError(404, "Tickets not found");

    const ids = tickets.map((ticket) => ticket.id);

    await prisma.$transaction([
      prisma.ticketActivity.deleteMany({ where: { ticketId: { in: ids } } }),
      prisma.ticket.deleteMany({ where: { id: { in: ids } } }),
    ]);

    res.json({ ok: true, deletedCount: ids.length });
  } catch (e) {
    next(e);
  }
});

ticketsRouter.get("/:id", async (req, res, next) => {
  try {
    const { role, orgId } = userCtx(req);
    const id = req.params.id;

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        org: true,
        requester: { select: { id: true, name: true } },
        hospitalDepartment: { select: { id: true, name: true, type: true } },
        assignee: { select: { id: true, name: true } },
        resolvedBy: { select: { id: true, name: true } },
        status: { select: { id: true, key: true, labelHe: true, color: true } },
        activities: {
          orderBy: { createdAt: "asc" },
          include: { actor: { select: { id: true, name: true } } },
        },
      },
    });
    if (!ticket) throw new HttpError(404, "Ticket not found");

    if (role === Role.CUSTOMER && ticket.orgId !== orgId) throw new HttpError(403, "Forbidden");

    res.json(ticket);
  } catch (e) {
    next(e);
  }
});

ticketsRouter.post("/", async (req, res, next) => {
  try {
    const { role, orgId, sub } = userCtx(req);
    const body = ticketCreateSchema.parse(req.body);

    let finalOrgId = orgId ?? null;
    if (role === Role.CUSTOMER) {
      if (!orgId) throw new HttpError(403, "Customer missing orgId");
      finalOrgId = orgId;
    }
    if (!finalOrgId) throw new HttpError(400, "Missing orgId");

    const number = await nextTicketNumber();
    const defaultStatus = await prisma.ticketStatus.findFirst({
      where: { orgId: finalOrgId, isDefault: true, isActive: true },
      select: { id: true },
    });

    if (!defaultStatus) throw new HttpError(500, "Default ticket status is not configured");

    const statusIdToUse = body.statusId ?? defaultStatus.id;

    const ticket = await prisma.ticket.create({
      data: {
        number,
        subject: body.subject,
        description: body.description,
        priority: body.priority ?? "MEDIUM",
        statusId: statusIdToUse,
        orgId: finalOrgId,
        source: role === Role.CUSTOMER ? TicketSource.PORTAL : TicketSource.TECHNICIAN,
        assigneeId: body.assigneeId ?? null,
        hospitalDepartmentId: body.hospitalDepartmentId,
        externalRequesterName: body.externalRequesterName,
        externalRequesterPhone: body.externalRequesterPhone,
      },
      include: { org: true },
    });

    await prisma.ticketActivity.create({
      data: {
        ticketId: ticket.id,
        actorId: sub,
        type: "created",
        message: "Ticket created",
      },
    });

    res.status(201).json(ticket);
  } catch (e) {
    next(e);
  }
});

ticketsRouter.patch("/:id", async (req, res, next) => {
  try {
    const { role, orgId, sub } = userCtx(req);
    const id = req.params.id;
    const parsed = ticketPatchSchema.safeParse(req.body);
    if (!parsed.success) {
      const msg = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(" | ");
      throw new HttpError(400, msg);
    }
    const body = parsed.data;

    const normalizedBody = {
      ...body,
      externalRequesterPhone: body.externalRequesterPhone?.trim() === "" ? null : body.externalRequesterPhone,
      externalRequesterName: body.externalRequesterName?.trim() === "" ? null : body.externalRequesterName,
    };

    const existing = await prisma.ticket.findUnique({
      where: { id },
      include: { status: { select: { id: true, key: true } } },
    });
    if (!existing) throw new HttpError(404, "Ticket not found");
    if (role === Role.CUSTOMER && existing.orgId !== orgId) throw new HttpError(403, "Forbidden");

    if (role === Role.CUSTOMER) {
      const allowed = ["description"] as const;
      const keys = Object.keys(body);
      for (const k of keys) {
        if (!allowed.includes(k as any)) throw new HttpError(403, "Customers can only add details (description)");
      }
    }

    let nextStatusKey: string | null = null;

    if (normalizedBody.statusId) {
      nextStatusKey = await getStatusKeyById(normalizedBody.statusId);
    } else {
      nextStatusKey = existing.status?.key ? String(existing.status.key).toUpperCase() : null;
    }

    const isResolved = nextStatusKey === "RESOLVED";
    const isClosing = nextStatusKey === "CLOSED";

    if (isClosing) {
      const summary = (normalizedBody.resolutionSummary ?? existing.resolutionSummary ?? "").trim();
      if (summary.length < 4) {
        throw new HttpError(400, "Cannot close ticket without resolution summary (min 4 chars).");
      }
    }

    const updated = await prisma.ticket.update({
      where: { id },
      data: {
        subject: body.subject,
        description: body.description,
        priority: body.priority,
        statusId: body.statusId ?? undefined,
        assigneeId: body.assigneeId ?? undefined,
        hospitalDepartmentId: body.hospitalDepartmentId ?? undefined,
        notes: body.notes ?? undefined,
        resolutionSummary: body.resolutionSummary ?? undefined,
        resolutionDetails: body.resolutionDetails ?? undefined,
        resolvedById: isResolved && !existing.resolvedById ? sub : undefined,
        resolvedAt: isResolved && !existing.resolvedAt ? new Date() : undefined,
        closedAt: isClosing && !existing.closedAt ? new Date() : undefined,
        externalRequesterName: normalizedBody.externalRequesterName ?? undefined,
        externalRequesterPhone: normalizedBody.externalRequesterPhone ?? undefined,
      },
      include: {
        requester: { select: { id: true, name: true } },
        hospitalDepartment: { select: { id: true, name: true, type: true } },
        assignee: { select: { id: true, name: true } },
      },
    });

    await prisma.ticketActivity.create({
      data: {
        ticketId: id,
        actorId: sub,
        type: "updated",
        message: "Ticket updated",
        metaJson: JSON.stringify({ keys: Object.keys(body) }),
      },
    });

    res.json(updated);
  } catch (e) {
    next(e);
  }
});
