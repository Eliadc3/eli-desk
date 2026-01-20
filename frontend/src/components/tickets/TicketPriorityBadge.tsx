import { cn } from "@/lib/utils";

export type TicketPriority = "low" | "medium" | "high" | "urgent";

interface TicketPriorityBadgeProps {
  priority?: string | null;
  size?: "sm" | "md";
}

const priorityConfig: Record<
  TicketPriority,
  { label: string; className: string; icon: string }
> = {
  low: { label: "נמוך", className: "bg-gray-100 text-gray-700 border-gray-200", icon: "⬇️" },
  medium: { label: "בינוני", className: "bg-blue-100 text-blue-800 border-blue-200", icon: "➡️" },
  high: { label: "גבוה", className: "bg-amber-100 text-amber-800 border-amber-200", icon: "⬆️" },
  urgent: { label: "דחוף", className: "bg-red-100 text-red-800 border-red-200", icon: "🚨" },
};

function normalizePriority(input?: string | null): TicketPriority {
  const p = String(input ?? "")
    .trim()
    .toLowerCase()
    .replace(/_/g, "-");

  // מיפויים מה-Backend (Prisma enum טיפוסי)
  if (p === "low") return "low";
  if (p === "medium") return "medium";
  if (p === "high") return "high";
  if (p === "urgent") return "urgent";

  // לפעמים מגיעים ערכים אחרים כמו "normal"
  if (p === "normal") return "medium";

  // fallback קשיח כדי לא להפיל UI
  return "medium";
}

export function TicketPriorityBadge({ priority, size = "sm" }: TicketPriorityBadgeProps) {
  const key = normalizePriority(priority);
  const config = priorityConfig[key];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border font-medium",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm",
        config.className
      )}
      title={String(priority ?? "")}
    >
      <span aria-hidden="true">{config.icon}</span>
      {config.label}
    </span>
  );
}
