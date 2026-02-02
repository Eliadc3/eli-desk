import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { HttpError } from "../lib/httpError.js";
import { userCtx } from "../lib/userCtx.js";
import { Role, TicketSource } from "@prisma/client";
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

ticketsRouter.get("/", async (req, res, next) => {
  try {
    const { role, orgId } = userCtx(req);

    const statusId = String(req.query.statusId ?? "");
    const page = Math.max(1, Number(req.query.page ?? 1));
    const pageSize = Math.min(50, Math.max(5, Number(req.query.pageSize ?? 20)));
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (role === Role.CUSTOMER) {
      if (!orgId) throw new HttpError(403, "Customer missing orgId");
      where.orgId = orgId;
    }
    if (statusId) where.statusId = statusId;

    const [items, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
        include: {
          requester: { select: { id: true, name: true} },
          hospitalDepartment: { select: { id: true, name: true, type: true } },
          assignee: { select: { id: true, name: true, email: true } },
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

ticketsRouter.get("/:id", async (req, res, next) => {
  try {
    const { role, orgId } = userCtx(req);
    const id = req.params.id;

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        org: true,
        requester: { select: { id: true, name: true, } },
        hospitalDepartment: { select: { id: true, name: true, type: true } },
        assignee: { select: { id: true, name: true, email: true } },
        resolvedBy: { select: { id: true, name: true, email: true } },
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

    // enforce org rules
    let finalOrgId = body.orgId ?? orgId ?? null;
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
        priority: body.priority,
        statusId: statusIdToUse,
        orgId: finalOrgId,
        // IMPORTANT: we do NOT force requesterId=sub for technicians.
        // Technicians often open tickets on behalf of someone else.
        requesterId: role === Role.CUSTOMER ? sub : (body.requesterId ?? null),
        source: role === Role.CUSTOMER ? TicketSource.PORTAL : TicketSource.TECHNICIAN,
        assigneeId: body.assigneeId ?? null,
        hospitalDepartmentId: body.hospitalDepartmentId ?? undefined,

        // Requester details (allowed for internal tickets too)
        externalRequesterName: body.externalRequesterName ?? null,
        externalRequesterPhone: body.externalRequesterPhone ?? null,
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
      const msg = parsed.error.issues
        .map(i => `${i.path.join(".")}: ${i.message}`)
        .join(" | ");
      throw new HttpError(400, msg);
    }
    const body = parsed.data;


    const normalizedBody = {
      ...body,
      externalRequesterPhone:
        body.externalRequesterPhone?.trim() === "" ? null : body.externalRequesterPhone,
      externalRequesterName:
        body.externalRequesterName?.trim() === "" ? null : body.externalRequesterName,
    };

    const existing = await prisma.ticket.findUnique({
      where: { id },
      include: { status: { select: { id: true, key: true } } },
    });
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

    let nextStatusKey: string | null = null;

    if (normalizedBody.statusId) {
      const st = await prisma.ticketStatus.findFirst({
        where: { id: normalizedBody.statusId },
        select: { key: true },
      });
      if (!st) throw new HttpError(400, "Invalid statusId");
      nextStatusKey = st.key;
    } else {
      nextStatusKey = existing.status?.key ?? null;
    }

    const isClosing = nextStatusKey === "closed";

    if (isClosing) {
      const summary = (normalizedBody.resolutionSummary ?? existing.resolutionSummary ?? "").trim();
      // "יותר מ-3 תווים" => מינימום 4
      if (summary.length < 4) {
        throw new HttpError(
          400,
          "Cannot close ticket without resolution summary (min 4 chars)."
        );
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
        resolvedById: isClosing ? sub : undefined,
        closedAt: isClosing ? new Date() : undefined,


        externalRequesterName: normalizedBody.externalRequesterName ?? undefined,
        externalRequesterPhone: normalizedBody.externalRequesterPhone ?? undefined,

      },
      include: {
        requester: { select: { id: true, name: true } },
        hospitalDepartment: { select: { id: true, name: true, type: true } },
        assignee: { select: { id: true, name: true, email: true } },
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
