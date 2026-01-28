import { z } from "zod";
import { TicketPriority, TicketStatus } from "@prisma/client";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(4),
});

export const ticketCreateSchema = z.object({
  hospitalDepartmentId: z.string().min(1),
  subject: z.string().min(3),
  description: z.string().min(1),
  priority: z.nativeEnum(TicketPriority).optional(),
  status: z.nativeEnum(TicketStatus).optional(),
  orgId: z.string().optional(),
  requesterId: z.string().optional(),
  assigneeId: z.string().optional(),
  // Optional requester details (used by internal technicians too)
  externalRequesterName: z.string().min(2).optional(),
  externalRequesterPhone: z.string().min(4).optional(),
});

export const ticketPatchSchema = z.object({
  subject: z.string().min(3).optional(),
  description: z.string().min(1).optional(),
  priority: z.nativeEnum(TicketPriority).optional(),
  status: z.nativeEnum(TicketStatus).optional(),
  assigneeId: z.string().nullable().optional(),
  hospitalDepartmentId: z.string().min(1).optional(),
  notes: z.string().nullable().optional(),
  resolutionSummary: z.string().nullable().optional(),
  resolutionDetails: z.string().nullable().optional(),
  externalRequesterName: z.string().min(2).nullable().optional(),
  externalRequesterPhone: z.string().min(6).nullable().optional(),
});

export const publicTicketCreateSchema = z.object({
  hospitalDepartmentId: z.string().min(1),
  subject: z.string().min(3),
  description: z.string().min(1),
  priority: z.nativeEnum(TicketPriority).optional(),
  name: z.string().min(2).optional(),
  phone: z.string().min(4).optional(),
  orgId: z.string().optional(),
});

export const technicianCreateSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  password: z.string().min(6),
  techDepartmentId: z.string().optional().nullable(),
  permissions: z
    .array(
      z.enum([
        "TICKET_DELETE",
        "TICKET_DUPLICATE",
        "TICKET_REASSIGN",
        "TECH_MANAGE",
        "DEPT_MANAGE",
      ])
    )
    .optional(),
});

export const technicianPatchSchema = z.object({
  name: z.string().min(2).optional(),
  password: z.string().min(6).optional(),
  techDepartmentId: z.string().optional().nullable(),
  permissions: z
    .array(
      z.enum([
        "TICKET_DELETE",
        "TICKET_DUPLICATE",
        "TICKET_REASSIGN",
        "TECH_MANAGE",
        "DEPT_MANAGE",
      ])
    )
    .optional(),
});

export const departmentCreateSchema = z.object({
  name: z.string().min(2),
  type: z.enum(["TECH", "HOSPITAL"]),
});

export const departmentPatchSchema = z.object({
  name: z.string().min(2).optional(),
});
