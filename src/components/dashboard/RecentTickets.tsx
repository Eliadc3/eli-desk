import { Link } from "react-router-dom";
import { Clock, User, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface Ticket {
  id: string;
  subject: string;
  customer: string;
  status: "new" | "in-progress" | "waiting" | "resolved" | "closed";
  priority: "critical" | "high" | "medium" | "low";
  createdAt: string;
}

const mockTickets: Ticket[] = [
  {
    id: "TKT-001",
    subject: "המחשב לא נדלק לאחר עדכון Windows",
    customer: "אלכס גולדשטיין",
    status: "new",
    priority: "high",
    createdAt: "לפני 15 דקות",
  },
  {
    id: "TKT-002",
    subject: "בעיה בהתחברות ל-VPN מהבית",
    customer: "מיכל לוי",
    status: "in-progress",
    priority: "medium",
    createdAt: "לפני שעה",
  },
  {
    id: "TKT-003",
    subject: "בקשה להתקנת תוכנה חדשה",
    customer: "דוד כהן",
    status: "waiting",
    priority: "low",
    createdAt: "לפני 2 שעות",
  },
  {
    id: "TKT-004",
    subject: "שרת האימייל לא מגיב",
    customer: "שרה ישראלי",
    status: "in-progress",
    priority: "critical",
    createdAt: "לפני 3 שעות",
  },
  {
    id: "TKT-005",
    subject: "עדכון הרשאות משתמש",
    customer: "יוסי אברהם",
    status: "resolved",
    priority: "medium",
    createdAt: "לפני 4 שעות",
  },
];

const statusLabels: Record<Ticket["status"], string> = {
  new: "חדש",
  "in-progress": "בטיפול",
  waiting: "ממתין",
  resolved: "נפתר",
  closed: "סגור",
};

const priorityLabels: Record<Ticket["priority"], string> = {
  critical: "קריטי",
  high: "גבוה",
  medium: "בינוני",
  low: "נמוך",
};

export function RecentTickets() {
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
        {mockTickets.map((ticket) => (
          <Link
            key={ticket.id}
            to={`/tickets/${ticket.id}`}
            className="block p-4 hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-muted-foreground">
                    {ticket.id}
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
                    {ticket.customer}
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
      </div>
    </div>
  );
}
