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
import {
  STATUS_CONFIG,
  normalizeTicketStatus,
  TicketStatus,
} from "@/lib/ticketStatus";

const RtlLegend = ({ payload }: any) => {
  if (!payload?.length) return null;

  return (
    <div>
      {payload.map((entry: any, i: number) => (
        <div
          key={i}
          style={{
            display: "flex",
            flexDirection: "row-reverse", // ← הקובייה לפני הטקסט
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 8,
            marginBottom: 8,
          }}
        >
          <span style={{ fontSize: 14 }}>
            {entry.value}
          </span>
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

  const data = useMemo(() => {
    const raw: any = q.data;

    const tickets: any[] =
      Array.isArray(raw) ? raw :
        Array.isArray(raw?.items) ? raw.items :
          Array.isArray(raw?.data) ? raw.data :
            Array.isArray(raw?.tickets) ? raw.tickets :
              [];

    const counts: Record<TicketStatus, number> = {
      new: 0,
      "in-progress": 0,
      waiting: 0,
      resolved: 0,
      closed: 0,
    };

    for (const t of tickets) {
      const key = normalizeTicketStatus(t?.status);
      counts[key]++;
    }

    return (Object.keys(STATUS_CONFIG) as TicketStatus[])
      .map((key) => ({
        key,
        name: STATUS_CONFIG[key].label,
        value: counts[key],
        color: STATUS_CONFIG[key].color,
      }))
      .filter((x) => x.value > 0);
  }, [q.data]);

  return (
    <div className="bg-card rounded-lg p-5 border border-border shadow-card">
      <h3 className="text-base font-semibold text-foreground mb-4">
        קריאות לפי סטטוס
      </h3>

      <div className="h-64">
        {q.isLoading ? (
          <div className="text-sm text-muted-foreground">טוען נתונים...</div>
        ) : data.length === 0 ? (
          <div className="text-sm text-muted-foreground">אין נתונים להצגה</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="38%"          // מפנה מקום למקרא מימין
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
