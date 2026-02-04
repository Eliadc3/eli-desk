import { cn } from "@/lib/utils";
import { useTicketStatuses } from "@/hooks/useTicketStatuses";

interface TicketStatusBadgeProps {
  status?: string | null; // expects status key (e.g. "NEW")
  size?: "sm" | "md";
}

function normalizeKey(input?: string | null) {
  return String(input ?? "").trim().toUpperCase();
}

function hexToRgba(hex: string, alpha: number) {
  const h = hex.replace("#", "").trim();
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  if (full.length !== 6) return `rgba(107,114,128,${alpha})`; // fallback gray

  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function TicketStatusBadge({ status, size = "sm" }: TicketStatusBadgeProps) {
  const q = useTicketStatuses();
  const key = normalizeKey(status);

  const item = (q.data ?? []).find((x) => String(x.key).toUpperCase() === key);

  const label = item?.labelHe ?? (key || "—");
  const color = item?.color ?? "#6B7280";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-medium",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm"
      )}
      style={{
        borderColor: color,
        color: color,
        backgroundColor: hexToRgba(color, 0.15), // רקע עדין
      }}
      title={key}
    >
      {label}
    </span>
  );
}
