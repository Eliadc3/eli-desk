import { Router } from "express";
import { Permission } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { HttpError } from "../../lib/httpError.js";
import { requirePermission } from "../../middleware/requirePermission.js";
import { departmentCreateSchema, departmentPatchSchema } from "../schemas.js";

export const adminDepartmentsRouter = Router();

adminDepartmentsRouter.get("/departments", requirePermission(Permission.DEPT_MANAGE), async (req, res, next) => {
  try {
    const active = String(req.query.active ?? "true").toLowerCase() !== "false";

    const items = await prisma.department.findMany({
      where: { isActive: active },
      orderBy: [{ type: "asc" }, { name: "asc" }],
    });

    res.json({ items });
  } catch (e) {
    next(e);
  }
});

adminDepartmentsRouter.post(
  "/departments",
  requirePermission(Permission.DEPT_MANAGE),
  async (req, res, next) => {
    try {
      const body = departmentCreateSchema.parse(req.body);
      const created = await prisma.department.create({ data: body });
      res.status(201).json(created);
    } catch (e) {
      next(e);
    }
  }
);

adminDepartmentsRouter.patch(
  "/departments/:id",
  requirePermission(Permission.DEPT_MANAGE),
  async (req, res, next) => {
    try {
      const id = req.params.id;
      const body = departmentPatchSchema.parse(req.body);
      const updated = await prisma.department.update({ where: { id }, data: body });
      res.json(updated);
    } catch (e) {
      next(e);
    }
  }
);

adminDepartmentsRouter.get(
  "/departments/:id/usage",
  requirePermission(Permission.DEPT_MANAGE),
  async (req, res, next) => {
    try {
      const id = req.params.id;

      const dept = await prisma.department.findUnique({
        where: { id },
        select: { id: true, type: true },
      });
      if (!dept) throw new HttpError(404, "Department not found");

      const usedTickets =
        dept.type === "HOSPITAL"
          ? await prisma.ticket.count({ where: { hospitalDepartmentId: id } })
          : 0;

      const usedUsers =
        dept.type === "TECH"
          ? await prisma.user.count({ where: { techDepartmentId: id } })
          : 0;

      return res.json({ type: dept.type, usedTickets, usedUsers });
    } catch (e) {
      next(e);
    }
  }
);

adminDepartmentsRouter.post(
  "/departments/:id/reassign-tickets",
  requirePermission(Permission.DEPT_MANAGE),
  async (req, res, next) => {
    try {
      const fromId = req.params.id;
      const { toDepartmentId } = req.body ?? {};
      if (!toDepartmentId) throw new HttpError(400, "Missing toDepartmentId");
      if (fromId === toDepartmentId) throw new HttpError(400, "Cannot reassign to same department");

      const moved = await prisma.ticket.updateMany({
        where: { hospitalDepartmentId: fromId },
        data: { hospitalDepartmentId: toDepartmentId },
      });

      res.json({ ok: true, moved: moved.count });
    } catch (e) {
      next(e);
    }
  }
);

adminDepartmentsRouter.delete(
  "/departments/:id",
  requirePermission(Permission.DEPT_MANAGE),
  async (req, res, next) => {
    try {
      const id = req.params.id;

      const dept = await prisma.department.findUnique({
        where: { id },
        select: { id: true, name: true, type: true, isActive: true },
      });
      if (!dept) throw new HttpError(404, "Department not found");

      const updated = await prisma.department.update({
        where: { id },
        data: { isActive: false },
        select: { id: true, name: true, type: true, isActive: true },
      });

      return res.json({ ok: true, item: updated });
    } catch (e) {
      next(e);
    }
  }
);

adminDepartmentsRouter.delete(
  "/departments/:id/permanent",
  requirePermission(Permission.DEPT_MANAGE),
  async (req, res, next) => {
    try {
      const id = req.params.id;

      const dept = await prisma.department.findUnique({
        where: { id },
        select: { id: true, name: true, type: true, isActive: true },
      });
      if (!dept) throw new HttpError(404, "Department not found");
      if (dept.isActive) throw new HttpError(400, "Cannot delete active department");

      if (dept.type === "HOSPITAL") {
        const tickets = await prisma.ticket.findMany({
          where: { hospitalDepartmentId: id },
          select: { number: true },
          orderBy: { number: "asc" },
        });

        if (tickets.length) {
          return res.status(409).json({
            error: "Department has tickets",
            details: { ticketNumbers: tickets.map((t) => t.number) },
          });
        }
      }

      if (dept.type === "TECH") {
        const users = await prisma.user.findMany({
          where: { techDepartmentId: id },
          select: { id: true, username: true, name: true },
          orderBy: { name: "asc" },
        });

        if (users.length) {
          return res.status(409).json({
            error: "Department has technicians",
            details: {
              users: users.map((u) => ({ id: u.id, username: u.username, name: u.name })),
            },
          });
        }
      }

      await prisma.department.delete({ where: { id } });
      return res.json({ ok: true });
    } catch (e) {
      next(e);
    }
  }
);

adminDepartmentsRouter.patch(
  "/departments/:id/active",
  requirePermission(Permission.DEPT_MANAGE),
  async (req, res, next) => {
    try {
      const id = req.params.id;
      const { isActive } = req.body ?? {};
      if (typeof isActive !== "boolean") throw new HttpError(400, "Missing isActive boolean");

      const updated = await prisma.department.update({ where: { id }, data: { isActive } });
      res.json(updated);
    } catch (e) {
      next(e);
    }
  }
);
