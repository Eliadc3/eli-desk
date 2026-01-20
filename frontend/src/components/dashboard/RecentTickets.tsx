import { Link } from "react-router-dom";
import { Clock, User, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { listTickets } from "@/api/tickets";

interface RecentTicket {
  id: string;
  number: number;
  subject: string;
  requesterName: string;
  status: "new" | "in-progress" | "waiting" | "resolved" | "closed";
  priority: "critical" | "high" | "medium" | "low";
  createdAt: string;
}

const statusLabels: Record<RecentTicket["status"], string> = {
  new: "חדש",
  "in-progress": "בטיפול",
  waiting: "ממתין",
  resolved: "נפתר",
  closed: "סגור",
};

const priorityLabels: Record<RecentTicket["priority"], string> = {
  critical: "קריטי",
  high: "גבוה",
  medium: "בינוני",
  low: "נמוך",
};

export function RecentTickets() {
  const { data, isLoading } = useQuery({
    queryKey: ["recent-tickets"],
    queryFn: async () => {
      const tickets = await listTickets();
      return tickets
        .sort(
          (a: any, b: any) =>
            new Date(b.createdAt).getTime() -
            new Date(a.createdAt).getTime()
        )
        .slice(0, 5)
        .map(
          (t: any): RecentTicket => ({
            id: t.id,                 // ID אמיתי ל־URL
            number: t.number,         // מספר קריאה
            subject: t.subject,
            requesterName:
              t.source === "PUBLIC"
                ? t.externalRequesterName ||
                  t.externalRequesterEmail ||
                  "Public"
                : t.requester?.name ||
                  t.requester?.email ||
                  "—",
            status: String(t.status || "")
              .toLowerCase()
              .split("_")
              .join("-") as any,
            priority: String(t.priority || "").toLowerCase() as any,
            createdAt: new Date(t.createdAt).toLocaleString(),
          })
        );
    },
  });

  return (
    <div className="bg-card rounded-lg border border-border shadow-card">
      <div className="p-5 border-b border-border flex items-center justify-between">
        <h3 className="text-base font-semibold text-foreground">
          קריאות אחרונות
        </h3>
        <Link
          to="/tickets"
          className="text-sm text-primary hover:text-primary/80 flex items-center gap-1"
        >
          הצג הכל
          <ArrowLeft className="w-4 h-4" />
        </Link>
      </div>

      <div className="divide-y divide-border">
        {isLoading && (
          <div className="p-4 text-sm text-muted-foreground">
            טוען קריאות...
          </div>
        )}

        {data?.map((ticket) => (
          <Link
            key={ticket.id}
            to={`/tickets/${ticket.id}`}
            className="block p-4 hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-muted-foreground">
                    #{ticket.number}
                  </span>

                  <span
                    className={cn(
                      "status-badge",
                      `status-${ticket.status}`
                    )}
                  >
                    {statusLabels[ticket.status]}
                  </span>

                  <span
                    className={cn(
                      "status-badge",
                      `priority-${ticket.priority}`
                    )}
                  >
                    {priorityLabels[ticket.priority]}
                  </span>
                </div>

                <p className="text-sm font-medium text-foreground truncate">
                  {ticket.subject}
                </p>

                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {ticket.requesterName}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {ticket.createdAt}
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}

        {!isLoading && data?.length === 0 && (
          <div className="p-4 text-sm text-muted-foreground">
            אין קריאות להצגה
          </div>
        )}
      </div>
    </div>
  );
}
