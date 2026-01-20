export type TicketStatus = "new" | "in-progress" | "waiting"  | "resolved" | "closed";

export const STATUS_CONFIG: Record<
  TicketStatus,
  { label: string; badgeClassName: string; color: string }
> = {
  new: {
    label: "חדש",
    badgeClassName: "bg-blue-100 text-blue-800 border-blue-200",
    color: "#3B82F6", // blue-500
  },
  "in-progress": {
    label: "בטיפול",
    badgeClassName: "bg-amber-100 text-amber-800 border-amber-200",
    color: "#F59E0B", // amber-500
  },
  waiting: {
    label: "ממתין ללקוח",
    badgeClassName: "bg-purple-100 text-purple-800 border-purple-200",
    color: "#8B5CF6", // purple-500
  },
  resolved: {
    label: "נפתר",
    badgeClassName: "bg-green-100 text-green-800 border-green-200",
    color: "#22C55E", // green-500
  },
  closed: {
    label: "סגור",
    badgeClassName: "bg-gray-100 text-gray-600 border-gray-200",
    color: "#6B7280", // gray-500
  },
};

export function normalizeTicketStatus(input?: string | null): TicketStatus {
  const s = String(input ?? "")
    .trim()
    .toLowerCase()
    .replace(/_/g, "-"); // IN_PROGRESS -> in-progress

  if (s === "waiting-on-customer") return "waiting";
  if (s === "waiting") return "waiting";
  if (s === "in-progress") return "in-progress";
  if (s === "new") return "new";
  if (s === "resolved") return "resolved";
  if (s === "closed") return "closed";

  return "new";
}
