import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { listTickets } from "@/api/tickets";
import { useTicketStatuses } from "@/hooks/useTicketStatuses";

const RtlLegend = ({ payload }: any) => {
  if (!payload?.length) return null;

  return (
    <div>
      {payload.map((entry: any, i: number) => (
        <div
          key={i}
          style={{
            display: "flex",
            flexDirection: "row-reverse",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 8,
            marginBottom: 8,
          }}
        >
          <span style={{ fontSize: 14 }}>{entry.value}</span>
          <span
            style={{
              width: 12,
              height: 12,
              backgroundColor: entry.color,
              borderRadius: 3,
              flexShrink: 0,
            }}
          />
        </div>
      ))}
    </div>
  );
};

const RtlTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;

  const p = payload[0];

  return (
    <div
      style={{
        direction: "rtl",
        textAlign: "right",
        background: "white",
        border: "1px solid #e5e7eb",
        borderRadius: 10,
        padding: "10px 12px",
        boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
        fontSize: 14,
      }}
    >
      <div style={{ fontWeight: 700 }}>{p.name}</div>
      <div>{`קריאות: ${p.value}`}</div>
    </div>
  );
};

export function TicketsByStatusChart() {
  const q = useQuery({
    queryKey: ["tickets"],
    queryFn: () => listTickets(),
  });

  const statusesQ = useTicketStatuses();

  const data = useMemo(() => {
    const statuses = statusesQ.data ?? [];
    const raw: any = q.data;

    const tickets: any[] =
      Array.isArray(raw) ? raw :
      Array.isArray(raw?.items) ? raw.items :
      Array.isArray(raw?.data) ? raw.data :
      Array.isArray(raw?.tickets) ? raw.tickets :
      [];

    // init counts per known statuses
    const counts: Record<string, number> = {};
    for (const s of statuses) {
      counts[String(s.key).trim().toUpperCase()] = 0;
    }

    // count tickets
    for (const t of tickets) {
      const key =
        typeof t.status === "string"
          ? t.status
          : (t.status?.key ?? t.statusKey ?? "");

      const k = String(key).trim().toUpperCase();
      if (!k) continue;

      if (counts[k] === undefined) counts[k] = 0;
      counts[k]++;
    }

    return statuses
      .map((s) => {
        const k = String(s.key).trim().toUpperCase();
        return {
          key: k,
          name: s.labelHe,
          value: counts[k] ?? 0,
          color: s.color ?? "#6B7280",
        };
      })
      .filter((x) => x.value > 0);
  }, [q.data, statusesQ.data]);

  const isLoading = q.isLoading || statusesQ.isLoading;

  return (
    <div className="bg-card rounded-lg p-5 border border-border shadow-card">
      <h3 className="text-base font-semibold text-foreground mb-4">
        קריאות לפי סטטוס
      </h3>

      <div className="h-64">
        {isLoading ? (
          <div className="text-sm text-muted-foreground">טוען נתונים...</div>
        ) : (statusesQ.data?.length ?? 0) === 0 ? (
          <div className="text-sm text-muted-foreground">אין סטטוסים פעילים במערכת</div>
        ) : data.length === 0 ? (
          <div className="text-sm text-muted-foreground">אין נתונים להצגה</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="38%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                nameKey="name"
              >
                {data.map((entry) => (
                  <Cell key={entry.key} fill={entry.color} />
                ))}
              </Pie>

              <Tooltip content={<RtlTooltip />} />
              <Legend
                layout="vertical"
                align="right"
                verticalAlign="middle"
                content={<RtlLegend />}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
