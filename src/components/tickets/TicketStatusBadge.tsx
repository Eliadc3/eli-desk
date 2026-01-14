import { cn } from "@/lib/utils";

export type TicketStatus = "new" | "in-progress" | "waiting" | "resolved" | "closed";

interface TicketStatusBadgeProps {
  status: TicketStatus;
  size?: "sm" | "md";
}

const statusConfig: Record<
  TicketStatus,
  { label: string; className: string }
> = {
  new: {
    label: "חדש",
    className: "bg-blue-100 text-blue-800 border-blue-200",
  },
  "in-progress": {
    label: "בטיפול",
    className: "bg-amber-100 text-amber-800 border-amber-200",
  },
  waiting: {
    label: "ממתין ללקוח",
    className: "bg-purple-100 text-purple-800 border-purple-200",
  },
  resolved: {
    label: "נפתר",
    className: "bg-green-100 text-green-800 border-green-200",
  },
  closed: {
    label: "סגור",
    className: "bg-gray-100 text-gray-600 border-gray-200",
  },
};

export function TicketStatusBadge({ status, size = "sm" }: TicketStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-medium",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm",
        config.className
      )}
    >
      {config.label}
    </span>
  );
}
