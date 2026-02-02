// backend/src/routes/public.ts
import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { TicketPriority, TicketSource } from "@prisma/client";
import { getHospitalDepartments } from "../services/departments.service.js";


const publicRouter = Router();

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
  // ודא שיש seed שמייצר את Counter ticketNumber, אחרת זה יזרוק
  const c = await prisma.counter.update({
    where: { key: "ticketNumber" },
    data: { value: { increment: 1 } },
    select: { value: true },
  });
  return c.value;
}

// GET /public/hospital-departments
publicRouter.get("/hospital-departments", async (_req, res) => {
  const items = await getHospitalDepartments();
  return res.json({ items });
});



publicRouter.post("/tickets", async (req, res) => {
  try {
    const hospitalDepartmentId = String(req.body?.hospitalDepartmentId ?? "").trim();
    const subject = String(req.body?.subject ?? "").trim();
    const description = String(req.body?.description ?? "").trim();
  

    if (!hospitalDepartmentId || !subject || !description || !req.body?.name || !req.body?.phone) {
      return res.status(400).json({
        message: "hospital Department, subject, description, name, phone are required",
      });
    }

    // ⚠️ אם יש לך org אמיתי – עדיף להביא orgId מהקליינט/קונפיג ולא hardcode
    const orgId = String(req.body?.orgId ?? "demo-org").trim();
    const priority = normalizePriority(req.body?.priority);

    const externalRequesterName = normalizeStr(req.body?.name ?? req.body?.externalRequesterName);
    const externalRequesterPhone = normalizeStr(req.body?.phone ?? req.body?.externalRequesterPhone);

    // טכנאי רנדומלי (אם יש)
    const techs = await prisma.user.findMany({
      where: { orgId, role: { in: ["TECHNICIAN", "ADMIN"] } },
      select: { id: true },
    });
    const assigneeId = techs.length ? techs[Math.floor(Math.random() * techs.length)].id : null;

    // ✅ חובה: סטטוס דיפולט (לפי orgId)
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

        // ✅ זה מה שחסר לך:
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

    return res.json({ ticket });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ message: e?.message ?? "Server error" });
  }
});

export default publicRouter;
