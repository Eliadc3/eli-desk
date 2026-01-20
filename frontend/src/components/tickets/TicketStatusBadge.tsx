import { cn } from "@/lib/utils";
import { STATUS_CONFIG, normalizeTicketStatus } from "@/lib/ticketStatus";



interface TicketStatusBadgeProps {
  status?: string | null;
  size?: "sm" | "md";
}

export function TicketStatusBadge({ status, size = "sm" }: TicketStatusBadgeProps) {
  const key = normalizeTicketStatus(status);
  const config = STATUS_CONFIG[key];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-medium",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm",
        config.badgeClassName
      )}
    >
      {config.label}
    </span>
  );
}
