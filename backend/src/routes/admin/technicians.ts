import { Router } from "express";
import bcrypt from "bcryptjs";
import { Prisma, Permission, Role } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { HttpError } from "../../lib/httpError.js";
import { requirePermission } from "../../middleware/requirePermission.js";
import { technicianCreateSchema, technicianPatchSchema } from "../schemas.js";

export const adminTechniciansRouter = Router();

adminTechniciansRouter.get(
  "/assignees",
  requirePermission(Permission.TICKET_REASSIGN),
  async (_req, res, next) => {
    try {
      const items = await prisma.user.findMany({
        where: { role: Role.TECHNICIAN, isActive: true },
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      });

      res.json({ items });
    } catch (e) {
      next(e);
    }
  }
);

adminTechniciansRouter.get("/technicians", requirePermission(Permission.TECH_MANAGE), async (req, res, next) => {
  try {
    const active = String(req.query.active ?? "true").toLowerCase() !== "false";

    const items = await prisma.user.findMany({
      where: { role: Role.TECHNICIAN, isActive: active },
      orderBy: { name: "asc" },
      include: { techDepartment: true, permissions: true },
    });

    res.json({ items });
  } catch (e) {
    next(e);
  }
});

adminTechniciansRouter.post(
  "/technicians",
  requirePermission(Permission.TECH_MANAGE),
  async (req, res, next) => {
    try {
      const body = technicianCreateSchema.parse(req.body);
      const passwordHash = await bcrypt.hash(body.password, 10);

      let created: { id: string; username: string; name: string; role: Role; techDepartmentId: string | null; isActive: boolean };

      try {
        created = await prisma.user.create({
          data: {
            username: body.username,
            name: body.name,
            passwordHash,
            role: Role.TECHNICIAN,
            techDepartmentId: body.techDepartmentId,
          },
          select: { id: true, username: true, name: true, role: true, techDepartmentId: true, isActive: true },
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

      if (body.permissions?.length) {
        const uniquePerms = Array.from(new Set(body.permissions));

        try {
          await prisma.userPermission.createMany({
            data: uniquePerms.map((p) => ({ userId: created.id, perm: p as any })),
          });
        } catch (e: any) {
          if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
            return res.status(409).json({ error: "Permission already assigned" });
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

adminTechniciansRouter.patch(
  "/technicians/:id",
  requirePermission(Permission.TECH_MANAGE),
  async (req, res, next) => {
    try {
      const id = req.params.id;
      const body = technicianPatchSchema.parse(req.body);

      const existing = await prisma.user.findUnique({
        where: { id },
        select: { id: true, role: true, techDepartmentId: true, isActive: true },
      });
      if (!existing) throw new HttpError(404, "User not found");
      if (existing.role !== Role.TECHNICIAN) throw new HttpError(400, "Only technicians can be edited here");

      const hasDeptInBody = Object.prototype.hasOwnProperty.call(body, "techDepartmentId");
      const deptAfter = hasDeptInBody
        ? String((body as any).techDepartmentId ?? "").trim()
        : String(existing.techDepartmentId ?? "").trim();

      if (!deptAfter) {
        throw new HttpError(400, "Technician must have a department");
      }
      if (body.isActive === true && !deptAfter) {
        throw new HttpError(400, "Cannot enable technician without department");
      }

      const data: any = {};
      if (body.username) data.username = body.username;
      if (body.name) data.name = body.name;
      if (body.isActive !== undefined) data.isActive = body.isActive;
      if (hasDeptInBody) data.techDepartmentId = deptAfter;
      if (body.password) data.passwordHash = await bcrypt.hash(body.password, 10);

      const updated = await prisma.user.update({
        where: { id },
        data,
        select: { id: true, username: true, name: true, role: true, techDepartmentId: true, isActive: true },
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
    } catch (e) {
      next(e);
    }
  }
);

adminTechniciansRouter.get(
  "/technicians/:id/usage",
  requirePermission(Permission.TECH_MANAGE),
  async (req, res, next) => {
    try {
      const id = req.params.id;

      const assignedTickets = await prisma.ticket.count({ where: { assigneeId: id } });
      const resolvedTickets = await prisma.ticket.count({ where: { resolvedById: id } });

      return res.json({ assignedTickets, resolvedTickets });
    } catch (e) {
      next(e);
    }
  }
);

adminTechniciansRouter.post(
  "/technicians/:id/reassign-tickets",
  requirePermission(Permission.TECH_MANAGE),
  async (req, res, next) => {
    try {
      const fromId = req.params.id;
      const { toTechnicianId } = req.body ?? {};
      if (!toTechnicianId) throw new HttpError(400, "Missing toTechnicianId");
      if (fromId === toTechnicianId) throw new HttpError(400, "Cannot reassign to same technician");

      const moved = await prisma.ticket.updateMany({
        where: { assigneeId: fromId },
        data: { assigneeId: toTechnicianId },
      });

      res.json({ ok: true, moved: moved.count });
    } catch (e) {
      next(e);
    }
  }
);

adminTechniciansRouter.delete(
  "/technicians/:id",
  requirePermission(Permission.TECH_MANAGE),
  async (req, res, next) => {
    try {
      const id = req.params.id;

      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) throw new HttpError(404, "User not found");
      if (user.role !== Role.TECHNICIAN) throw new HttpError(400, "Only technicians can be disabled here");

      const updated = await prisma.user.update({
        where: { id },
        data: { isActive: false },
        select: { id: true, username: true, name: true, role: true, techDepartmentId: true, isActive: true },
      });

      res.json({ ok: true, item: updated });
    } catch (e) {
      next(e);
    }
  }
);

adminTechniciansRouter.delete(
  "/technicians/:id/permanent",
  requirePermission(Permission.TECH_MANAGE),
  async (req, res, next) => {
    try {
      const id = req.params.id;

      const user = await prisma.user.findUnique({
        where: { id },
        select: { id: true, role: true, isActive: true },
      });
      if (!user) throw new HttpError(404, "User not found");
      if (user.role !== Role.TECHNICIAN) throw new HttpError(400, "Only technicians can be deleted here");
      if (user.isActive) throw new HttpError(400, "Cannot delete active technician");

      const tickets = await prisma.ticket.findMany({
        where: {
          OR: [{ assigneeId: id }, { resolvedById: id }],
        },
        select: { number: true },
        orderBy: { number: "asc" },
      });

      if (tickets.length) {
        const uniqueNumbers = Array.from(new Set(tickets.map((t) => t.number)));

        return res.status(409).json({
          error: "Technician has tickets",
          details: { ticketNumbers: uniqueNumbers },
        });
      }

      await prisma.$transaction([
        prisma.userPermission.deleteMany({ where: { userId: id } }),
        prisma.user.delete({ where: { id } }),
      ]);

      return res.json({ ok: true });
    } catch (e) {
      next(e);
    }
  }
);

adminTechniciansRouter.patch(
  "/technicians/:id/active",
  requirePermission(Permission.TECH_MANAGE),
  async (req, res, next) => {
    try {
      const id = req.params.id;
      const { isActive } = req.body ?? {};
      if (typeof isActive !== "boolean") throw new HttpError(400, "Missing isActive boolean");

      const updated = await prisma.user.update({
        where: { id },
        data: { isActive },
        select: { id: true, username: true, name: true, role: true, techDepartmentId: true, isActive: true },
      });

      res.json(updated);
    } catch (e) {
      next(e);
    }
  }
);
