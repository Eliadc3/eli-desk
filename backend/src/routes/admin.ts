import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";
import { HttpError } from "../lib/httpError.js";
import { Prisma, Permission, Role } from "@prisma/client";
import { requirePermission } from "../middleware/requirePermission.js";
import {
  technicianCreateSchema,
  technicianPatchSchema,
  departmentCreateSchema,
  departmentPatchSchema,
  ticketStatusCreateSchema,
  ticketStatusPatchSchema,
} from "./schemas.js";
import { userCtx } from "../lib/userCtx.js";

export const adminRouter = Router();

/* =========================
   Ticket Statuses (Admin)
   ========================= */

// List statuses for current org
adminRouter.get(
  "/ticket-statuses",
  requirePermission(Permission.DEPT_MANAGE),
  async (req, res, next) => {
    try {
      const { orgId } = userCtx(req);
      if (!orgId) throw new HttpError(400, "Missing orgId");

      const items = await prisma.ticketStatus.findMany({
        where: { orgId },
        orderBy: [{ sortOrder: "asc" }, { labelHe: "asc" }],
        select: {
          id: true,
          key: true,
          labelHe: true,
          color: true,
          sortOrder: true,
          isActive: true,
          isDefault: true,
        },
      });

      res.json({ items });
    } catch (e) {
      next(e);
    }
  }
);

// Create status
adminRouter.post(
  "/ticket-statuses",
  requirePermission(Permission.DEPT_MANAGE),
  async (req, res, next) => {
    try {
      const { orgId } = userCtx(req);
      if (!orgId) throw new HttpError(400, "Missing orgId");

      const body = ticketStatusCreateSchema.parse(req.body);

      // אם מסמנים default חדש – נבטל אחרים
      if (body.isDefault) {
        await prisma.ticketStatus.updateMany({
          where: { orgId, isDefault: true },
          data: { isDefault: false },
        });
      }

      const created = await prisma.ticketStatus.create({
        data: {
          orgId,
          key: body.key,
          labelHe: body.labelHe,
          color: body.color ?? null,
          sortOrder: body.sortOrder ?? 0,
          isActive: body.isActive ?? true,
          isDefault: body.isDefault ?? false,
        },
        select: {
          id: true,
          key: true,
          labelHe: true,
          color: true,
          sortOrder: true,
          isActive: true,
          isDefault: true,
        },
      });

      res.status(201).json(created);
    } catch (e) {
      next(e);
    }
  }
);

// Patch status (draft -> save)
adminRouter.patch(
  "/ticket-statuses/:id",
  requirePermission(Permission.DEPT_MANAGE),
  async (req, res, next) => {
    try {
      const { orgId } = userCtx(req);
      if (!orgId) throw new HttpError(400, "Missing orgId");

      const id = req.params.id;
      const body = ticketStatusPatchSchema.parse(req.body);

      // ודא שזה שייך לאותו org
      const existing = await prisma.ticketStatus.findFirst({
        where: { id, orgId },
        select: { id: true },
      });
      if (!existing) throw new HttpError(404, "Status not found");

      // אם הופך ל-default – מבטלים אחרים
      if (body.isDefault === true) {
        await prisma.ticketStatus.updateMany({
          where: { orgId, isDefault: true, NOT: { id } },
          data: { isDefault: false },
        });
      }

      const updated = await prisma.ticketStatus.update({
        where: { id },
        data: {
          key: body.key,
          labelHe: body.labelHe,
          color: body.color === undefined ? undefined : body.color,
          sortOrder: body.sortOrder,
          isActive: body.isActive,
          isDefault: body.isDefault,
        },
        select: {
          id: true,
          key: true,
          labelHe: true,
          color: true,
          sortOrder: true,
          isActive: true,
          isDefault: true,
        },
      });

      res.json(updated);
    } catch (e) {
      next(e);
    }
  }
);

// Delete status (עם הגנה אם יש קריאות שמשתמשות בו)
adminRouter.delete(
  "/ticket-statuses/:id",
  requirePermission(Permission.DEPT_MANAGE),
  async (req, res, next) => {
    try {
      const { orgId } = userCtx(req);
      if (!orgId) throw new HttpError(400, "Missing orgId");

      const id = req.params.id;

      const existing = await prisma.ticketStatus.findFirst({
        where: { id, orgId },
        select: { id: true, isDefault: true },
      });
      if (!existing) throw new HttpError(404, "Status not found");
      if (existing.isDefault) throw new HttpError(400, "Cannot delete default status");

      const used = await prisma.ticket.count({ where: { statusId: id } });
      if (used > 0) throw new HttpError(400, "Status is in use");

      await prisma.ticketStatus.delete({ where: { id } });
      res.json({ ok: true });
    } catch (e) {
      next(e);
    }
  }
);

/* =========================
   Departments
   ========================= */

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
      select: { id: true, name: true },
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

adminRouter.post(
  "/technicians",
  requirePermission(Permission.TECH_MANAGE),
  async (req, res, next) => {
    try {
      const body = technicianCreateSchema.parse(req.body);
      const passwordHash = await bcrypt.hash(body.password, 10);

      // 1) Create user + handle duplicate username (P2002)
      let created: { id: string; username: string; name: string; role: Role; techDepartmentId: string | null };

      try {
        created = await prisma.user.create({
          data: {
            username: body.username,
            name: body.name,
            passwordHash,
            role: Role.TECHNICIAN,
            techDepartmentId: body.techDepartmentId,
          },
          select: { id: true, username: true, name: true, role: true, techDepartmentId: true },
        });
      } catch (e: any) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
          return res.status(409).json({
            error: "Username already exists",
            details: { field: "username" },
          });
        }
        throw e;
      }

      // 2) Permissions
      if (body.permissions?.length) {
        const uniquePerms = Array.from(new Set(body.permissions));

        try {
          await prisma.userPermission.createMany({
            data: uniquePerms.map((p) => ({ userId: created.id, perm: p as any })),
          });
        } catch (e: any) {
          // Fallback: if unique constraint still happens for any reason
          if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
            // אפשר גם להתעלם לגמרי; פה נחזיר הודעה ידידותית
            return res.status(409).json({
              error: "Permission already assigned",
            });
          }
          throw e;
        }
      }

      return res.status(201).json(created);
    } catch (e) {
      console.error("CREATE TECH ERROR:", e);
      next(e);
    }
  }
);


adminRouter.patch("/technicians/:id", requirePermission(Permission.TECH_MANAGE), async (req, res, next) => {
  try {
    const id = req.params.id;
    const body = technicianPatchSchema.parse(req.body);

    const data: any = {};
    if (body.username) data.username = body.username;
    if (body.name) data.name = body.name;
    if (body.techDepartmentId !== undefined) data.techDepartmentId = body.techDepartmentId;
    if (body.password) data.passwordHash = await bcrypt.hash(body.password, 10);


    const updated = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, username: true, name: true, role: true, techDepartmentId: true },
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
        statusId: orig.statusId,
        priority: orig.priority,
        orgId: orig.orgId,
        requesterId: orig.requesterId,
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
