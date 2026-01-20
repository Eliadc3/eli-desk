import { MainLayout } from "@/components/layout/MainLayout";
import { KPICard } from "@/components/dashboard/KPICard";
import { TicketsByStatusChart } from "@/components/dashboard/TicketsByStatusChart";
import { RecentTickets } from "@/components/dashboard/RecentTickets";
import { SLAComplianceChart } from "@/components/dashboard/SLAComplianceChart";
import { AgentWorkload } from "@/components/dashboard/AgentWorkload";
import {
  Ticket,
  AlertTriangle,
  Clock,
  Timer,
  CheckCircle2,
} from "lucide-react";

export default function Dashboard() {
  return (
    <MainLayout title="דשבורד" subtitle="סקירת מערכת הקריאות">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard
          title="קריאות פתוחות"
          value={48}
          icon={<Ticket className="w-5 h-5" />}
          iconBgClass="bg-blue-100"
          iconTextClass="text-blue-600"
          trend={{ value: 12, isPositive: false }}
        />
        <KPICard
          title="חריגות SLA"
          value={5}
          icon={<AlertTriangle className="w-5 h-5" />}
          iconBgClass="bg-red-100"
          iconTextClass="text-red-600"
          trend={{ value: 25, isPositive: true }}
        />
        <KPICard
          title="לטיפול היום"
          value={12}
          icon={<Clock className="w-5 h-5" />}
          iconBgClass="bg-amber-100"
          iconTextClass="text-amber-600"
        />
        <KPICard
          title="זמן תגובה ממוצע"
          value="2.4 שעות"
          icon={<Timer className="w-5 h-5" />}
          iconBgClass="bg-green-100"
          iconTextClass="text-green-600"
          trend={{ value: 8, isPositive: true }}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <TicketsByStatusChart />
        <SLAComplianceChart />
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentTickets />
        </div>
        <AgentWorkload />
      </div>
    </MainLayout>
  );
}
