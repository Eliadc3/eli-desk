import { cn } from "@/lib/utils";
import { AlertTriangle, ArrowUp, Minus, ArrowDown } from "lucide-react";

export type TicketPriority = "critical" | "high" | "medium" | "low";

interface TicketPriorityBadgeProps {
  priority: TicketPriority;
  showIcon?: boolean;
  size?: "sm" | "md";
}

const priorityConfig: Record<
  TicketPriority,
  { label: string; className: string; icon: typeof AlertTriangle }
> = {
  critical: {
    label: "קריטי",
    className: "bg-red-100 text-red-800 border-red-200",
    icon: AlertTriangle,
  },
  high: {
    label: "גבוה",
    className: "bg-orange-100 text-orange-800 border-orange-200",
    icon: ArrowUp,
  },
  medium: {
    label: "בינוני",
    className: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: Minus,
  },
  low: {
    label: "נמוך",
    className: "bg-green-100 text-green-800 border-green-200",
    icon: ArrowDown,
  },
};

export function TicketPriorityBadge({
  priority,
  showIcon = true,
  size = "sm",
}: TicketPriorityBadgeProps) {
  const config = priorityConfig[priority];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border font-medium",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm",
        config.className
      )}
    >
      {showIcon && <Icon className={cn(size === "sm" ? "w-3 h-3" : "w-4 h-4")} />}
      {config.label}
    </span>
  );
}
