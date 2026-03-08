import { z } from "zod";
import { TicketPriority } from "@prisma/client";

export const loginSchema = z.object({
  username: z.string().min(2),
  password: z.string().min(4),
});

// Tickets
// helper: לפחות 4 ספרות (מתעלם מרווחים/מקפים)
const phoneMin4Digits = z
  .string()
  .transform((v) => String(v ?? "").trim())
  .refine((v) => (v.match(/\d/g) ?? []).length >= 4, {
    message: "טלפון חייב להכיל לפחות 4 ספרות",
  });

const ticketCreateBaseSchema = z.object({
  hospitalDepartmentId: z.string().trim().min(1, "חובה לבחור מחלקה"),
  externalRequesterName: z.string().trim().min(2, "שם חייב להכיל לפחות 2 תווים"),
  externalRequesterPhone: phoneMin4Digits,

  subject: z.string().trim().min(3, "נושא חייב להכיל לפחות 3 תווים"),
  description: z.string().trim().min(6, "תיאור הוא חובה"),

  // אופציונלי – בפנימי יש לך דיפולט, ובחיצוני אתה שם דיפולט
  statusId: z.string().trim().min(1).optional(),
  priority: z.nativeEnum(TicketPriority).optional(),

  // עדיין אופציונלי: שיוך לטכנאי
  assigneeId: z.string().optional().nullable(),
});

// ✅ טופס פנימי
export const ticketCreateSchema = ticketCreateBaseSchema;

// ✅ טופס חיצוני
export const publicTicketCreateSchema = ticketCreateBaseSchema;

export const ticketPatchSchema = z.object({
  subject: z.string().min(3).optional(),
  description: z.string().min(1).optional(),
  priority: z.nativeEnum(TicketPriority).optional(),
  externalRequesterName: z.string().min(2),
  externalRequesterPhone: z.string().min(4),

  // Status is now dynamic (table) => send statusId
  statusId: z.string().min(1).optional(),

  assigneeId: z.string().nullable().optional(),
  hospitalDepartmentId: z.string().min(1).optional(),
  notes: z.string().nullable().optional(),
  resolutionSummary: z.string().nullable().optional(),
  resolutionDetails: z.string().nullable().optional(),
});

// Technicians (Admin)
export const technicianCreateSchema = z.object({
  username: z.string().min(2),
  name: z.string().min(2),
  password: z.string().min(6),
  techDepartmentId: z.string().min(1),
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
  username: z.string().min(2).optional(),
  password: z.string().min(6).optional(),
  techDepartmentId: z.string().trim().min(1, "techDepartmentId is required").optional(),
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
    isActive: z.boolean().optional(),
});

// Departments (Admin)
export const departmentCreateSchema = z.object({
  name: z.string().min(2),
  type: z.enum(["TECH", "HOSPITAL"]),
});

export const departmentPatchSchema = z.object({
  name: z.string().min(2).optional(),
  isActive: z.boolean().optional(),
});

export const ticketStatusCreateSchema = z.object({
  key: z.string().trim().min(1).max(50).transform((v) => v.toUpperCase()),
  labelHe: z.string().trim().min(1).max(100),
  color: z.string().trim().regex(/^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/).optional().nullable(),
  sortOrder: z.number().int().min(0).max(9999).optional(),
  isActive: z.boolean().optional(),
  isDefault: z.boolean().optional(),
});

export const ticketStatusPatchSchema = z.object({
  key: z.string().trim().min(1).max(50).transform((v) => v.toUpperCase()).optional(),
  labelHe: z.string().trim().min(1).max(100).optional(),
  color: z
    .union([z.string().trim().regex(/^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/), z.null()])
    .optional(),
  sortOrder: z.number().int().min(0).max(9999).optional(),
  isActive: z.boolean().optional(),
  isDefault: z.boolean().optional(),
});