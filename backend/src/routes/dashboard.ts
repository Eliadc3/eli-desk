import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { Role, TicketPriority } from "@prisma/client";

export const dashboardRouter = Router();

function userCtx(req: any) {
    return req.user as { sub: string; role: Role; orgId?: string | null };
}

const FIRST_RESPONSE_SLA_MINUTES: Record<TicketPriority, number> = {
    URGENT: 60,
    HIGH: 240,
    MEDIUM: 480,
    LOW: 1440,
};

function startOfDay(d = new Date()) {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
}

function addDays(d: Date, days: number) {
    const x = new Date(d);
    x.setDate(x.getDate() + days);
    return x;
}

function addMonths(d: Date, months: number) {
    const x = new Date(d);
    x.setMonth(x.getMonth() + months);
    return x;
}

function monthKey(d: Date) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
}

function monthLabelHe(d: Date) {
    const months = [
        "ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני",
        "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"
    ];
    return months[d.getMonth()];
}

function pctChange(current: number, previous: number): number | null {
    if (previous === 0) return null; // אין בסיס להשוואה
    return ((current - previous) / previous) * 100;
}

async function computeFirstResponseMinutes(ticketIds: string[]) {
    // map[ticketId] => minutes | null
    if (!ticketIds.length) return new Map<string, number | null>();

    const activities = await prisma.ticketActivity.findMany({
        where: { ticketId: { in: ticketIds } },
        orderBy: { createdAt: "asc" },
        select: { ticketId: true, type: true, actorId: true, createdAt: true },
    });

    const firstResponseAt = new Map<string, Date>();
    for (const a of activities) {
        if (a.type === "created") continue;
        if (!a.actorId) continue;
        if (!firstResponseAt.has(a.ticketId)) firstResponseAt.set(a.ticketId, a.createdAt);
    }

    const tickets = await prisma.ticket.findMany({
        where: { id: { in: ticketIds } },
        select: { id: true, createdAt: true },
    });

    const out = new Map<string, number | null>();
    for (const t of tickets) {
        const fr = firstResponseAt.get(t.id);
        if (!fr) out.set(t.id, null);
        else {
            const minutes = Math.max(0, Math.round((fr.getTime() - t.createdAt.getTime()) / 60000));
            out.set(t.id, minutes);
        }
    }
    return out;
}

async function computeBreachesAndAvgFirstResponse(whereBase: any, from: Date, to: Date) {
    const tickets = await prisma.ticket.findMany({
        where: { ...whereBase, createdAt: { gte: from, lt: to } },
        select: { id: true, createdAt: true, priority: true },
    });

    const ticketIds = tickets.map((t) => t.id);
    const frMap = await computeFirstResponseMinutes(ticketIds);

    let breaches = 0;
    let sum = 0;
    let cnt = 0;

    for (const t of tickets) {
        const fr = frMap.get(t.id) ?? null;
        if (fr === null) continue;

        cnt += 1;
        sum += fr;

        if (fr > FIRST_RESPONSE_SLA_MINUTES[t.priority]) breaches += 1;
    }

    return {
        breaches,
        avgFirstResponseMinutes: cnt ? sum / cnt : null,
    };
}

async function countCreatedBetween(whereBase: any, from: Date, to: Date) {
    return prisma.ticket.count({
        where: {
            ...whereBase,
            createdAt: { gte: from, lt: to },
        },
    });
}


async function computeOpenTicketsAt(whereBase: any, at: Date) {
    // “היו פתוחות בתאריך X” לפי timestamps (ולא לפי status הנוכחי)
    // פתוחה ב-X אם: נפתחה עד X, ולא נסגרה/נפתרה לפני X
    return prisma.ticket.count({
        where: {
            ...whereBase,
            createdAt: { lte: at },
            AND: [
                { OR: [{ resolvedAt: null }, { resolvedAt: { gt: at } }] },
                { OR: [{ closedAt: null }, { closedAt: { gt: at } }] },
            ],
        },
    });
}

dashboardRouter.get("/summary", async (req, res, next) => {
    try {
        const { role, orgId } = userCtx(req);

        const whereBase: any = {};
        if (role === Role.CUSTOMER) {
            if (!orgId) return res.status(403).json({ message: "Customer missing orgId" });
            whereBase.orgId = orgId;
        }

        const openWhere = {
            ...whereBase,
            status: {
                is: {
                    key: { not: "closed" },
                },
            },
        };



        const todayStart = startOfDay(new Date());
        const tomorrowStart = addDays(todayStart, 1);

        // KPI window comparisons: 7 ימים אחרונים מול 7 ימים לפני
        const now = new Date();
        const currFrom = addDays(now, -7);
        const prevFrom = addDays(now, -14);
        const prevTo = addDays(now, -7);

        // Charts window: 6 חודשים אחורה
        const chartWindowStart = addMonths(todayStart, -6);

        const [openCount, dueTodayCount, ticketsForChart, technicians] = await Promise.all([
            prisma.ticket.count({ where: openWhere }),
            prisma.ticket.count({
                where: { ...openWhere, createdAt: { gte: todayStart, lt: tomorrowStart } },
            }),
            prisma.ticket.findMany({
                where: { ...whereBase, createdAt: { gte: chartWindowStart } },
                select: { id: true, createdAt: true, priority: true },
            }),
            prisma.user.findMany({
                where: { role: Role.TECHNICIAN },
                select: { id: true, name: true },
                orderBy: { name: "asc" },
            }),
        ]);

        // KPI: breaches + avg (current snapshot over chart window already computed below for all months)
        // אבל KPI עצמו נחשב על בסיס 6 חודשים? עדיף שיהיה "כללי".
        // נשמור KPI "slaBreaches" כסכום חריגות בחלון 6 חודשים (כמו קודם),
        // ואת ה-trend נעשה על 7/7.
        const chartTicketIds = ticketsForChart.map((t) => t.id);
        const frMinutesChart = await computeFirstResponseMinutes(chartTicketIds);

        let slaBreachesKpi = 0;
        let avgSumKpi = 0;
        let avgCntKpi = 0;

        for (const t of ticketsForChart) {
            const fr = frMinutesChart.get(t.id) ?? null;
            if (fr === null) continue;

            avgSumKpi += fr;
            avgCntKpi += 1;

            if (fr > FIRST_RESPONSE_SLA_MINUTES[t.priority]) slaBreachesKpi += 1;
        }

        const avgFirstResponseMinutesKpi = avgCntKpi ? avgSumKpi / avgCntKpi : null;

        // SLA by month (6 חודשים)
        const months: { key: string; label: string; met: number; breached: number }[] = [];
        for (let i = 5; i >= 0; i--) {
            const d = addMonths(todayStart, -i);
            months.push({ key: monthKey(d), label: monthLabelHe(d), met: 0, breached: 0 });
        }
        const idxByKey = new Map(months.map((m, i) => [m.key, i] as const));

        for (const t of ticketsForChart) {
            const mk = monthKey(new Date(t.createdAt));
            const idx = idxByKey.get(mk);
            if (idx === undefined) continue;

            const fr = frMinutesChart.get(t.id) ?? null;
            if (fr === null) continue;

            const isBreached = fr > FIRST_RESPONSE_SLA_MINUTES[t.priority];
            if (isBreached) months[idx].breached += 1;
            else months[idx].met += 1;
        }

        // Workload: פתוחות מוקצות + נפתרו היום
        const techIds = technicians.map((t) => t.id);

        const [openByTech, resolvedTodayByTech] = await Promise.all([
            prisma.ticket.groupBy({
                by: ["assigneeId"],
                where: { ...openWhere, assigneeId: { in: techIds } },
                _count: { _all: true },
            }),
            prisma.ticket.groupBy({
                by: ["resolvedById"],
                where: {
                    ...whereBase,
                    resolvedAt: { gte: todayStart, lt: tomorrowStart },
                    resolvedById: { in: techIds },
                },
                _count: { _all: true },
            }),
        ]);

        const openMap = new Map<string, number>();
        for (const r of openByTech) if (r.assigneeId) openMap.set(r.assigneeId, r._count._all);

        const resolvedMap = new Map<string, number>();
        for (const r of resolvedTodayByTech) if (r.resolvedById) resolvedMap.set(r.resolvedById, r._count._all);

        const agents = technicians.map((t) => {
            const parts = t.name.split(" ").filter(Boolean);
            const initials = (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
            return {
                id: t.id,
                name: t.name,
                initials: initials || t.name.slice(0, 2),
                openTickets: openMap.get(t.id) ?? 0,
                resolvedToday: resolvedMap.get(t.id) ?? 0,
                capacity: 12,
            };
        });

        // -------- Trends (7 ימים אחרונים מול 7 ימים לפני) --------

        // Created tickets trend: עכשיו מול "לפני 7 ימים"
        const [createdCurr7d, createdPrev7d] = await Promise.all([
            countCreatedBetween(whereBase, currFrom, now),
            countCreatedBetween(whereBase, prevFrom, prevTo),
        ]);

        const openTicketsPct = pctChange(createdCurr7d, createdPrev7d);


        // SLA breaches + avg first response trends לפי tickets שנפתחו בחלון
        const [currWin, prevWin] = await Promise.all([
            computeBreachesAndAvgFirstResponse(whereBase, currFrom, now),
            computeBreachesAndAvgFirstResponse(whereBase, prevFrom, prevTo),
        ]);

        const slaBreachesPct = pctChange(currWin.breaches, prevWin.breaches);

        // avg response trend: אם אין avg בתקופה קודמת — null
        const avgFirstResponsePct =
            currWin.avgFirstResponseMinutes != null && prevWin.avgFirstResponseMinutes != null
                ? pctChange(currWin.avgFirstResponseMinutes, prevWin.avgFirstResponseMinutes)
                : null;

        res.json({
            kpis: {
                openTickets: openCount,
                slaBreaches: slaBreachesKpi,
                dueToday: dueTodayCount,
                avgFirstResponseMinutes: avgFirstResponseMinutesKpi,
            },
            trends: {
                openTicketsPct,
                slaBreachesPct,
                avgFirstResponsePct,
            },
            slaByMonth: months.map((m) => ({ name: m.label, met: m.met, breached: m.breached })),
            agents,
        });
    } catch (e) {
        next(e);
    }
});
