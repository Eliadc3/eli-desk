import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

const data = [
  { name: "חדש", value: 12, color: "#3b82f6" },
  { name: "בטיפול", value: 28, color: "#f59e0b" },
  { name: "ממתין ללקוח", value: 8, color: "#8b5cf6" },
  { name: "נפתר", value: 45, color: "#22c55e" },
  { name: "סגור", value: 23, color: "#6b7280" },
];

export function TicketsByStatusChart() {
  return (
    <div className="bg-card rounded-lg p-5 border border-border shadow-card">
      <h3 className="text-base font-semibold text-foreground mb-4">
        קריאות לפי סטטוס
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                boxShadow: "var(--shadow-md)",
              }}
              formatter={(value: number) => [`${value} קריאות`, ""]}
            />
            <Legend
              layout="vertical"
              align="left"
              verticalAlign="middle"
              formatter={(value) => (
                <span className="text-sm text-foreground">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
