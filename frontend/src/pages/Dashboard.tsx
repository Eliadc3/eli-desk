import { MainLayout } from "@/components/layout/MainLayout";
import { KPICard } from "@/components/dashboard/KPICard";
import { TicketsByStatusChart } from "@/components/dashboard/TicketsByStatusChart";
import { RecentTickets } from "@/components/dashboard/RecentTickets";
import { SLAComplianceChart } from "@/components/dashboard/SLAComplianceChart";
import { AgentWorkload } from "@/components/dashboard/AgentWorkload";
import { Ticket, AlertTriangle, Clock, Timer } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getDashboardSummary } from "@/api/dashboard";

function formatAvgResponse(minutes: number | null): string {
  if (minutes === null || Number.isNaN(minutes)) return "—";
  const hours = minutes / 60;
  if (hours < 1) return `${Math.round(minutes)} דק׳`;
  return `${hours.toFixed(1)} שעות`;
}

// KPI trend UI: ב-KPICard "isPositive" = ירוק/חץ למעלה.
// אצלנו "טוב" = ירידה (פחות פתוחות/פחות חריגות/פחות זמן תגובה)
// לכן: אם האחוז שלילי -> זה "טוב" -> isPositive=true
function trendProp(pct: number | null | undefined) {
  if (pct == null || Number.isNaN(pct)) return undefined;
  return { value: Math.abs(Number(pct.toFixed(0))), isPositive: pct < 0 };
}

export default function Dashboard() {
  const q = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: getDashboardSummary,
    refetchInterval: 60_000,
  });

  const openTickets = q.data?.kpis.openTickets ?? 0;
  const slaBreaches = q.data?.kpis.slaBreaches ?? 0;
  const dueToday = q.data?.kpis.dueToday ?? 0;
  const avgFirstResponse = q.data?.kpis.avgFirstResponseMinutes ?? null;

  const openTrend = trendProp(q.data?.trends.openTicketsPct);
  const breachesTrend = trendProp(q.data?.trends.slaBreachesPct);
  const avgTrend = trendProp(q.data?.trends.avgFirstResponsePct);

  return (
    <MainLayout title="דשבורד" subtitle="סקירת מערכת הקריאות">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard
          title="קריאות פתוחות"
          value={openTickets}
          icon={<Ticket className="w-5 h-5" />}
          iconBgClass="bg-blue-100"
          iconTextClass="text-blue-600"
          trend={openTrend}
        />
        <KPICard
          title="חריגות SLA"
          value={slaBreaches}
          icon={<AlertTriangle className="w-5 h-5" />}
          iconBgClass="bg-red-100"
          iconTextClass="text-red-600"
          trend={breachesTrend}
        />
        <KPICard
          title="לטיפול היום"
          value={dueToday}
          icon={<Clock className="w-5 h-5" />}
          iconBgClass="bg-amber-100"
          iconTextClass="text-amber-600"
        />
        <KPICard
          title="זמן תגובה ממוצע"
          value={formatAvgResponse(avgFirstResponse)}
          icon={<Timer className="w-5 h-5" />}
          iconBgClass="bg-green-100"
          iconTextClass="text-green-600"
          trend={avgTrend}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <TicketsByStatusChart />
        <SLAComplianceChart data={q.data?.slaByMonth} />
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentTickets />
        </div>
        <AgentWorkload agents={q.data?.agents} />
      </div>
    </MainLayout>
  );
}
