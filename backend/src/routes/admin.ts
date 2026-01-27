import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";
import { HttpError } from "../lib/httpError.js";
import { Permission, Role } from "@prisma/client";
import { requirePermission } from "../middleware/requirePermission.js";
import {
  technicianCreateSchema,
  technicianPatchSchema,
  departmentCreateSchema,
  departmentPatchSchema,
} from "./schemas.js";

export const adminRouter = Router();

// Departments
adminRouter.get("/departments", requirePermission(Permission.DEPT_MANAGE), async (_req, res, next) => {
  try {
    const items = await prisma.department.findMany({ orderBy: [{ type: "asc" }, { name: "asc" }] });
    res.json({ items });
  } catch (e) { next(e); }
});

adminRouter.post("/departments", requirePermission(Permission.DEPT_MANAGE), async (req, res, next) => {
  try {
    const body = departmentCreateSchema.parse(req.body);
    const created = await prisma.department.create({ data: body });
    res.status(201).json(created);
  } catch (e) { next(e); }
});

adminRouter.patch("/departments/:id", requirePermission(Permission.DEPT_MANAGE), async (req, res, next) => {
  try {
    const id = req.params.id;
    const body = departmentPatchSchema.parse(req.body);
    const updated = await prisma.department.update({ where: { id }, data: body });
    res.json(updated);
  } catch (e) { next(e); }
});

adminRouter.delete("/departments/:id", requirePermission(Permission.DEPT_MANAGE), async (req, res, next) => {
  try {
    const id = req.params.id;
    const usedTickets = await prisma.ticket.count({ where: { hospitalDepartmentId: id } });
    const usedUsers = await prisma.user.count({ where: { techDepartmentId: id } });
    if (usedTickets > 0 || usedUsers > 0) throw new HttpError(400, "Department is in use");
    await prisma.department.delete({ where: { id } });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// Assignees
adminRouter.get("/assignees", requirePermission(Permission.TICKET_REASSIGN), async (_req, res, next) => {
  try {
    const items = await prisma.user.findMany({
      where: { role: Role.TECHNICIAN },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true },
    });

    res.json({ items });
  } catch (e) {
    next(e);
  }
});



// Technicians
adminRouter.get("/technicians", requirePermission(Permission.TECH_MANAGE), async (_req, res, next) => {
  try {
    const items = await prisma.user.findMany({
      where: { role: Role.TECHNICIAN },
      orderBy: { name: "asc" },
      include: { techDepartment: true, permissions: true },
    });
    res.json({ items });
  } catch (e) { next(e); }
});

adminRouter.post("/technicians", requirePermission(Permission.TECH_MANAGE), async (req, res, next) => {
  try {
    const body = technicianCreateSchema.parse(req.body);
    const passwordHash = await bcrypt.hash(body.password, 10);

    const created = await prisma.user.create({
      data: {
        email: body.email,
        name: body.name,
        passwordHash,
        role: Role.TECHNICIAN,
        techDepartmentId: body.techDepartmentId ?? null,
      },
      select: { id: true, email: true, name: true, role: true, techDepartmentId: true },
    });

    if (body.permissions?.length) {
      await prisma.userPermission.createMany({
        data: body.permissions.map((p) => ({ userId: created.id, perm: p as any })),
      });
    }

    res.status(201).json(created);
  } catch (e) { next(e); }
});

adminRouter.patch("/technicians/:id", requirePermission(Permission.TECH_MANAGE), async (req, res, next) => {
  try {
    const id = req.params.id;
    const body = technicianPatchSchema.parse(req.body);

    const data: any = {};
    if (body.name) data.name = body.name;
    if (body.techDepartmentId !== undefined) data.techDepartmentId = body.techDepartmentId;
    if (body.password) data.passwordHash = await bcrypt.hash(body.password, 10);

    const updated = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, email: true, name: true, role: true, techDepartmentId: true },
    });

    if (body.permissions) {
      await prisma.userPermission.deleteMany({ where: { userId: id } });
      if (body.permissions.length) {
        await prisma.userPermission.createMany({
          data: body.permissions.map((p: string) => ({ userId: id, perm: p as any })),
        });
      }
    }

    res.json(updated);
  } catch (e) { next(e); }
});

adminRouter.delete("/technicians/:id", requirePermission(Permission.TECH_MANAGE), async (req, res, next) => {
  try {
    const id = req.params.id;
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new HttpError(404, "User not found");
    if (user.role !== Role.TECHNICIAN) throw new HttpError(400, "Only technicians can be deleted here");

    const assigned = await prisma.ticket.count({ where: { assigneeId: id } });
    if (assigned > 0) throw new HttpError(400, "Technician has assigned tickets; reassign first");

    await prisma.userPermission.deleteMany({ where: { userId: id } });
    await prisma.user.delete({ where: { id } });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// Ticket power actions
adminRouter.post("/tickets/:id/reassign", requirePermission(Permission.TICKET_REASSIGN), async (req, res, next) => {
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
  } catch (e) { next(e); }
});

adminRouter.post("/tickets/:id/duplicate", requirePermission(Permission.TICKET_DUPLICATE), async (req, res, next) => {
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
        status: orig.status,
        priority: orig.priority,
        orgId: orig.orgId,
        requesterId: orig.requesterId,
        assigneeId: orig.assigneeId,
        source: orig.source,
        externalRequesterName: orig.externalRequesterName,
        externalRequesterEmail: orig.externalRequesterEmail,
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
  } catch (e) { next(e); }
});

adminRouter.delete("/tickets/:id", requirePermission(Permission.TICKET_DELETE), async (req, res, next) => {
  try {
    const id = req.params.id;
    await prisma.ticketActivity.deleteMany({ where: { ticketId: id } });
    await prisma.ticket.delete({ where: { id } });
    res.json({ ok: true });
  } catch (e) { next(e); }
});
