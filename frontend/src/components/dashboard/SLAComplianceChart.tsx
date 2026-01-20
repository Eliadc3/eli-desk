import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

type SLADataPoint = { name: string; met: number; breached: number };

const fallbackData: SLADataPoint[] = [
  { name: "ינואר", met: 45, breached: 5 },
  { name: "פברואר", met: 52, breached: 8 },
  { name: "מרץ", met: 48, breached: 3 },
  { name: "אפריל", met: 61, breached: 4 },
  { name: "מאי", met: 55, breached: 6 },
  { name: "יוני", met: 67, breached: 2 },
];

export function SLAComplianceChart({ data }: { data?: SLADataPoint[] }) {
  const chartData = data && data.length ? data : fallbackData;

  return (
    <div className="bg-card rounded-lg p-5 border border-border shadow-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-foreground">
          עמידה ב-SLA
        </h3>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-green-500" />
            עמדו ב-SLA
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-red-400" />
            חריגה
          </span>
        </div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barGap={2}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="name"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              axisLine={{ stroke: "hsl(var(--border))" }}
            />
            <YAxis
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              axisLine={{ stroke: "hsl(var(--border))" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                boxShadow: "var(--shadow-md)",
              }}
              formatter={(value: number, name: string) => [
                `${value} קריאות`,
                name === "met" ? "עמדו ב-SLA" : "חריגה",
              ]}
            />
            <Bar dataKey="met" fill="#22c55e" radius={[4, 4, 0, 0]} />
            <Bar dataKey="breached" fill="#f87171" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
