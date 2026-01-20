import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { env } from "../lib/env.js";
import { publicTicketCreateSchema } from "./schemas.js";
import { TicketSource } from "@prisma/client";
import { HttpError } from "../lib/httpError.js";

export const publicRouter = Router();

// Read-only list for public form
publicRouter.get("/hospital-departments", async (_req, res, next) => {
  try {
    const items = await prisma.department.findMany({ where: { type: "HOSPITAL" }, orderBy: { name: "asc" } });
    res.json({ items });
  } catch (e) {
    next(e);
  }
});


// POST /public/tickets
// Public form - no login.
// NOTE: routes to env.PUBLIC_FORM_ORG_ID unless orgId is provided.
publicRouter.post("/tickets", async (req, res, next) => {
  try {
    const body = publicTicketCreateSchema.parse(req.body);

    const orgId = body.orgId ?? env.PUBLIC_FORM_ORG_ID;
    const org = await prisma.organization.findUnique({ where: { id: orgId } });
    if (!org) throw new HttpError(400, "Invalid orgId (PUBLIC_FORM_ORG_ID not found)");

    // ticket number counter
    const c = await prisma.counter.upsert({
      where: { key: "ticketNumber" },
      update: { value: { increment: 1 } },
      create: { key: "ticketNumber", value: 1000 },
    });

    // Auto-assign (simple): random technician in same org
    const techs = await prisma.user.findMany({
      where: { role: "TECHNICIAN", orgId },
      select: { id: true },
      take: 200,
    });
    const assigneeId = techs.length ? techs[Math.floor(Math.random() * techs.length)].id : null;

    const ticket = await prisma.ticket.create({
      data: {
        number: c.value,
        subject: body.subject,
        description: body.description,
        priority: body.priority,
        orgId,
        assigneeId,
        source: TicketSource.PUBLIC,
        externalRequesterName: body.name ?? null,
        externalRequesterEmail: body.email ?? null,
        externalRequesterPhone: body.phone ?? null,
        hospitalDepartmentId: body.hospitalDepartmentId,
      },
      select: { id: true, number: true, subject: true, status: true, priority: true, createdAt: true },
    });

    await prisma.ticketActivity.create({
      data: {
        ticketId: ticket.id,
        actorId: null,
        type: "created",
        message: "Ticket created via public form",
      },
    });

    res.status(201).json({ ticket });
  } catch (e) {
    next(e);
  }
});
