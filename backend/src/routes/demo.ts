import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { TicketPriority, TicketStatus } from "@prisma/client";

export const demoRouter = Router();

function randChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function ensureCounter() {
  await prisma.counter.upsert({
    where: { key: "ticketNumber" },
    update: {},
    create: { key: "ticketNumber", value: 1000 },
  });
}

async function nextTicketNumber() {
  const c = await prisma.counter.update({
    where: { key: "ticketNumber" },
    data: { value: { increment: 1 } },
  });
  return c.value;
}

demoRouter.post("/reset", async (_req, res, next) => {
  try {
    // Deletes tickets + activities, keeps users/org for demo convenience
    await prisma.ticketActivity.deleteMany({});
    await prisma.ticket.deleteMany({});
    await prisma.counter.deleteMany({ where: { key: "ticketNumber" } });
    await ensureCounter();
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

demoRouter.post("/seed", async (req, res, next) => {
  const hospitalDept = await prisma.department.findFirst({ where: { type: "HOSPITAL" } });
  if(!hospitalDept) throw new Error("No hospital department found, seed departments first");
  try {
    const count = Math.min(200, Math.max(1, Number(req.query.count ?? 50)));
    await ensureCounter();

    const org = await prisma.organization.findFirst();
    const requester = await prisma.user.findFirst({ where: { role: "CUSTOMER" } });
    const assignee = await prisma.user.findFirst({ where: { role: "TECHNICIAN" } });

    const subjects = [
      "Printer issue",
      "Network latency",
      "Cannot login",
      "Need software install",
      "Email issue",
      "VPN issue",
    ];

    const created: string[] = [];

    for (let i = 0; i < count; i++) {
      const number = await nextTicketNumber();
      const status = randChoice([TicketStatus.NEW, TicketStatus.IN_PROGRESS, TicketStatus.WAITING_ON_CUSTOMER, TicketStatus.RESOLVED, TicketStatus.CLOSED]);
      const priority = randChoice([TicketPriority.LOW, TicketPriority.MEDIUM, TicketPriority.HIGH, TicketPriority.URGENT]);

      const t = await prisma.ticket.create({
        data: {
          number,
          subject: randChoice(subjects),
          description: "Generated ticket",
          status,
          priority,
          hospitalDepartmentId: hospitalDept.id,
          orgId: org?.id ?? "demo-org",
          requesterId: requester?.id ?? null,
          assigneeId: assignee?.id ?? null,
          resolutionSummary: status === "RESOLVED" || status === "CLOSED" ? "Resolved (generated)" : null,
          resolutionDetails: status === "RESOLVED" || status === "CLOSED" ? "Details..." : null,
          resolvedAt: status === "RESOLVED" || status === "CLOSED" ? new Date() : null,
          closedAt: status === "CLOSED" ? new Date() : null,
          resolvedById: assignee?.id ?? null,
        },
      });

      await prisma.ticketActivity.create({
        data: { ticketId: t.id, actorId: assignee?.id ?? null, type: "created", message: "Ticket created (seed)" },
      });

      created.push(t.id);
    }

    res.json({ ok: true, count: created.length });
  } catch (e) {
    next(e);
  }
});
