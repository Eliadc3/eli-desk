import { api } from "./client";

export type DashboardSummary = {
  kpis: {
    openTickets: number;
    slaBreaches: number;
    dueToday: number;
    avgFirstResponseMinutes: number | null;
  };
  trends: {
    openTicketsPct: number | null;
    slaBreachesPct: number | null;
    avgFirstResponsePct: number | null;
  };
  slaByMonth: { name: string; met: number; breached: number }[];
  agents: {
    id: string;
    name: string;
    initials: string;
    openTickets: number;
    resolvedToday: number;
    capacity: number;
  }[];
};

export async function getDashboardSummary() {
  const { data } = await api.get("/dashboard/summary");
  return data as DashboardSummary;
}
