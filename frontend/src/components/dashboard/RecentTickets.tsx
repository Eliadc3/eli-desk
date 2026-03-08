import { Link } from "react-router-dom";
import { Clock, User, ArrowLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { listTickets } from "@/api/tickets";
import { TicketStatusBadge } from "@/components/tickets/TicketStatusBadge";
import { TicketPriorityBadge } from "@/components/tickets/TicketPriorityBadge";

interface RecentTicket {
  id: string;
  number: number;
  subject: string;
  requesterName: string;
  statusKey?: string;
  statusLabel?: string;
  statusColor?: string | null;
  priority: "low" | "medium" | "high" | "urgent";
  createdAt: string;
}

export function RecentTickets() {
  const { data, isLoading } = useQuery({
    queryKey: ["recent-tickets"],
    queryFn: async () => {
      const tickets = await listTickets();

      return tickets
        .sort(
          (a: any, b: any) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, 5)
        .map(
          (t: any): RecentTicket => ({
            id: t.id,
            number: t.number,
            subject: t.subject,
            requesterName:
              t.source === "PUBLIC"
                ? t.externalRequesterName || "Public"
                : t.requester?.name || "—",
            statusKey: t.status?.key ?? "",
            statusLabel: t.status?.labelHe ?? "",
            statusColor: t.status?.color ?? "",
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
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-xs font-medium text-muted-foreground">
                    #{ticket.number}
                  </span>

                  <TicketStatusBadge
                    statusKey={ticket.statusKey}
                    label={ticket.statusLabel}
                    color={ticket.statusColor}
                  />

                  <TicketPriorityBadge priority={ticket.priority} />
                </div>

                <p className="text-sm font-medium text-foreground truncate">
                  {ticket.subject}
                </p>

                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
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