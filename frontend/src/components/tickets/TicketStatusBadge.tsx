import { cn } from "@/lib/utils";
import { useTicketStatuses } from "@/hooks/useTicketStatuses";

interface TicketStatusBadgeProps {
  status?: string | null; // expects status key (e.g. "NEW")
  size?: "sm" | "md";
}

function normalizeKey(input?: string | null) {
  return String(input ?? "").trim().toUpperCase();
}

export function TicketStatusBadge({ status, size = "sm" }: TicketStatusBadgeProps) {
  const q = useTicketStatuses();

  const key = normalizeKey(status);

  const item = (q.data ?? []).find((x) => String(x.key).toUpperCase() === key);

  // fallback (כשעוד אין נתונים/טוען/סטטוס לא קיים)
  const label = item?.labelHe ?? (key || "—");
  const color = item?.color ?? null;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-medium",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm"
      )}
      style={color ? { borderColor: color, color } : undefined}
      title={key}
    >
      {label}
    </span>
  );
}
