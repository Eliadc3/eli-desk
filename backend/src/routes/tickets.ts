import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { HttpError } from "../lib/httpError.js";
import { ticketCreateSchema, ticketPatchSchema } from "./schemas.js";
import { Role, TicketStatus, TicketSource, Permission } from "@prisma/client";

export const ticketsRouter = Router();

function userCtx(req: any) {
  return req.user as { sub: string; role: Role; orgId?: string | null };
}

async function nextTicketNumber() {
  const c = await prisma.counter.upsert({
    where: { key: "ticketNumber" },
    update: { value: { increment: 1 } },
    create: { key: "ticketNumber", value: 1000 },
  });
  return c.value;
}

ticketsRouter.get("/", async (req, res, next) => {
  try {
    const { role, orgId } = userCtx(req);

    const status = (req.query.status as string | undefined)?.toUpperCase();
    const q = (req.query.q as string | undefined)?.trim();
    const page = Math.max(1, Number(req.query.page ?? 1));
    const pageSize = Math.min(100, Math.max(10, Number(req.query.pageSize ?? 25)));

    const where: any = {};
    if (status && status !== "ALL") {
      if (!Object.values(TicketStatus).includes(status as any)) throw new HttpError(400, "Invalid status");
      where.status = status;
    }
    if (q) {
      where.OR = [
        { subject: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ];
    }
    if (role === Role.CUSTOMER) {
      if (!orgId) throw new HttpError(403, "Customer missing orgId");
      where.orgId = orgId;
    }

    const [items, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          org: true,
          requester: { select: { id: true, name: true, email: true } },
          assignee: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.ticket.count({ where }),
    ]);

    res.json({ items, total, page, pageSize });
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
        requester: { select: { id: true, name: true, email: true } },
        hospitalDepartment: { select: { id: true, name: true, type: true } },
        assignee: { select: { id: true, name: true, email: true } },
        resolvedBy: { select: { id: true, name: true, email: true } },
        activities: { orderBy: { createdAt: "asc" }, include: { actor: { select: { id: true, name: true } } } },
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

    // enforce org rules
    let finalOrgId = body.orgId ?? orgId ?? null;
    if (role === Role.CUSTOMER) {
      if (!orgId) throw new HttpError(403, "Customer missing orgId");
      finalOrgId = orgId;
    }
    if (!finalOrgId) throw new HttpError(400, "Missing orgId");

    const number = await nextTicketNumber();

    const ticket = await prisma.ticket.create({
      data: {
        number,
        subject: body.subject,
        description: body.description,
        priority: body.priority,
        status: body.status,
        orgId: finalOrgId,
        requesterId: role === Role.CUSTOMER ? sub : (body.requesterId ?? sub),
        source: role === Role.CUSTOMER ? TicketSource.PORTAL : TicketSource.TECHNICIAN,
        assigneeId: body.assigneeId ?? null,
        hospitalDepartmentId: body.hospitalDepartmentId,
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
    const body = ticketPatchSchema.parse(req.body);

    const existing = await prisma.ticket.findUnique({ where: { id } });
    if (!existing) throw new HttpError(404, "Ticket not found");
    if (role === Role.CUSTOMER && existing.orgId !== orgId) throw new HttpError(403, "Forbidden");

    // if customer: restrict edits
    if (role === Role.CUSTOMER) {
      const allowed = ["description"] as const;
      const keys = Object.keys(body);
      for (const k of keys) {
        if (!allowed.includes(k as any)) throw new HttpError(403, "Customers can only add details (description)");
      }
    }

    // resolution validation: require summary when moving to resolved/closed
    const nextStatus = body.status;
    const isClosing = nextStatus === "RESOLVED" || nextStatus === "CLOSED";
    if (isClosing) {
      const summary = body.resolutionSummary ?? existing.resolutionSummary ?? null;
      if (!summary || summary.trim().length < 3) {
        throw new HttpError(400, "resolutionSummary is required when resolving/closing");
      }
    }

        // Reassign permission guard (even via PATCH)
    const wantsReassign =
      Object.prototype.hasOwnProperty.call(body, "assigneeId") &&
      body.assigneeId !== existing.assigneeId;

    if (wantsReassign) {
      // admins are always allowed
      if (role !== Role.ADMIN && role !== Role.SUPER_ADMIN) {
        const found = await prisma.userPermission.findUnique({
          where: {
            userId_perm: { userId: sub, perm: Permission.TICKET_REASSIGN },
          },
        });

        if (!found) {
          throw new HttpError(403, "Missing permission: TICKET_REASSIGN");
        }
      }
    }


    const data: any = { ...body };

    // manage resolved fields
    if (isClosing) {
      data.resolvedAt = existing.resolvedAt ?? new Date();
      data.resolvedById = existing.resolvedById ?? sub;
      if (nextStatus === "CLOSED") {
        data.closedAt = existing.closedAt ?? new Date();
      }
    }

    const updated = await prisma.ticket.update({
      where: { id },
      data,
      include: {
        org: true,
        requester: { select: { id: true, name: true, email: true } },
        assignee: { select: { id: true, name: true, email: true } },
      },
    });

    await prisma.ticketActivity.create({
      data: {
        ticketId: id,
        actorId: sub,
        type: "updated",
        message: "Ticket updated",
        metaJson: JSON.stringify({ changed: Object.keys(body) }),
      },
    });

    // if resolution changed
    if ("resolutionSummary" in body || "resolutionDetails" in body || isClosing) {
      await prisma.ticketActivity.create({
        data: {
          ticketId: id,
          actorId: sub,
          type: "resolution",
          message: "Resolution updated",
        },
      });
    }

    res.json(updated);
  } catch (e) {
    next(e);
  }
});
