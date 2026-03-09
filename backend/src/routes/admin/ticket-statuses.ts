import { Router } from "express";
import { prisma } from "../../lib/prisma.js";
import { HttpError } from "../../lib/httpError.js";
import { Permission } from "@prisma/client";
import { requirePermission } from "../../middleware/requirePermission.js";
import { ticketStatusCreateSchema, ticketStatusPatchSchema } from "../schemas.js";
import { userCtx } from "../../lib/userCtx.js";

export const adminTicketStatusesRouter = Router();

adminTicketStatusesRouter.get(
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

adminTicketStatusesRouter.post(
  "/ticket-statuses",
  requirePermission(Permission.DEPT_MANAGE),
  async (req, res, next) => {
    try {
      const { orgId } = userCtx(req);
      if (!orgId) throw new HttpError(400, "Missing orgId");

      const body = ticketStatusCreateSchema.parse(req.body);

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

adminTicketStatusesRouter.patch(
  "/ticket-statuses/:id",
  requirePermission(Permission.DEPT_MANAGE),
  async (req, res, next) => {
    try {
      const { orgId } = userCtx(req);
      if (!orgId) throw new HttpError(400, "Missing orgId");

      const id = req.params.id;
      const body = ticketStatusPatchSchema.parse(req.body);

      const existing = await prisma.ticketStatus.findFirst({
        where: { id, orgId },
        select: { id: true },
      });
      if (!existing) throw new HttpError(404, "Status not found");

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

adminTicketStatusesRouter.delete(
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
