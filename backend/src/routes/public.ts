// backend/src/routes/public.ts
import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { TicketPriority, TicketSource } from "@prisma/client";
import { getHospitalDepartments } from "../services/departments.service.js";
import { env } from "../lib/env.js";
import { publicTicketCreateSchema } from "./schemas.js";
import { HttpError } from "../lib/httpError.js";
import { ZodError } from "zod";

const publicRouter = Router();
const orgId = env.APP_ORG_ID;

function normalizeStr(v: unknown) {
  const s = typeof v === "string" ? v.trim() : "";
  return s.length ? s : null;
}

function normalizePriority(v: unknown): TicketPriority {
  const p = typeof v === "string" ? v.trim().toUpperCase() : "";
  if (p === "LOW") return "LOW";
  if (p === "MEDIUM") return "MEDIUM";
  if (p === "HIGH") return "HIGH";
  if (p === "URGENT") return "URGENT";
  return "MEDIUM";
}

async function getDefaultStatusId(orgId: string) {
  // 1) דיפולט לפי isDefault בתוך אותו ארגון
  const byDefault = await prisma.ticketStatus.findFirst({
    where: { orgId, isDefault: true, isActive: true },
    select: { id: true },
  });
  if (byDefault) return byDefault.id;

  // 2) נפילה ל- key NEW/new בתוך אותו ארגון
  const byKey = await prisma.ticketStatus.findFirst({
    where: { orgId, isActive: true, OR: [{ key: "NEW" }, { key: "new" }] },
    select: { id: true },
  });
  if (byKey) return byKey.id;

  throw new Error(`No default ticket status found for orgId=${orgId}`);
}

async function nextTicketNumber() {
  const c = await prisma.counter.upsert({
    where: { key: "ticketNumber" },
    update: { value: { increment: 1 } },
    create: { key: "ticketNumber", value: 1000 },
    select: { value: true },
  });
  return c.value;
}


publicRouter.get("/hospital-departments", async (_req, res, next) => {
  try {
    const items = await getHospitalDepartments();
    res.json({ items });
  } catch (e) {
    next(e);
  }
});




publicRouter.post("/tickets", async (req, res) => {
  try {
    // 1) Zod validation (מחזיר fieldErrors ברור)
    const parsed = publicTicketCreateSchema.safeParse({
      hospitalDepartmentId: req.body?.hospitalDepartmentId,
      subject: req.body?.subject,
      description: req.body?.description,

      // תומך גם בשם/טלפון וגם externalRequesterName/Phone
      externalRequesterName: req.body?.name ?? req.body?.externalRequesterName,
      externalRequesterPhone: req.body?.phone ?? req.body?.externalRequesterPhone,

      priority: req.body?.priority,
      orgId: orgId, // env.APP_ORG_ID
    });

    if (!parsed.success) {
      return res.status(400).json({
        error: "Validation error",
        details: parsed.error.flatten(),
      });
    }

    const body = parsed.data;

    // 2) normalize (שומר על מה שכבר עשית, אבל אחרי Zod)
    const hospitalDepartmentId = String(body.hospitalDepartmentId).trim();
    const subject = String(body.subject).trim();
    const description = String(body.description).trim();

    const externalRequesterName = String(body.externalRequesterName).trim();
    const externalRequesterPhone = String(body.externalRequesterPhone).trim();

    const priority = normalizePriority(body.priority);

    // 3) בחר טכנאי פעיל בלבד
    const techs = await prisma.user.findMany({
      where: { orgId, isActive: true, role: { in: ["TECHNICIAN", "ADMIN"] } },
      select: { id: true },
    });
    const assigneeId = techs.length ? techs[Math.floor(Math.random() * techs.length)].id : null;

    const statusId = await getDefaultStatusId(orgId);
    const number = await nextTicketNumber();

    const ticket = await prisma.ticket.create({
      data: {
        number,
        subject,
        description,
        priority,
        orgId,
        assigneeId,
        source: "PUBLIC" satisfies TicketSource,
        externalRequesterName,
        externalRequesterPhone,
        hospitalDepartmentId,
        statusId,
      },
      select: {
        id: true,
        number: true,
        subject: true,
        status: true,
        priority: true,
        createdAt: true,
      },
    });

    return res.status(201).json({ ticket });
  } catch (e: any) {
    // אם בכל זאת נופל פה ZodError ממקום אחר
    if (e instanceof ZodError) {
      return res.status(400).json({
        error: "Validation error",
        details: e.flatten(),
      });
    }

    console.error(e);
    return res.status(500).json({ message: e?.message ?? "Server error" });
  }
});
export default publicRouter;
