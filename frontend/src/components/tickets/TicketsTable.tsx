import { Link, useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { TicketStatusBadge } from "./TicketStatusBadge";
import { TicketPriorityBadge } from "./TicketPriorityBadge";
import { Clock, Building2 } from "lucide-react";

export interface TicketRow {
  id: string;
  number?: number;
  displayId?: string;
  subject: string;
  requester: {
    name: string;
    initials: string;
  };
  department: string;

  status?: string;
  statusId?: string;
  statusKey?: string;
  statusLabel?: string;
  statusColor?: string | null;

  priority: TicketPriority;

  assignee?: {
    id?: string;
    name: string;
    initials: string;
  };
  assigneeId?: string | null;

  createdAt: string;
  slaDeadline?: string;
  isOverdue?: boolean;
}

export type TicketPriority =
  | "low"
  | "medium"
  | "high"
  | "urgent";

interface TicketsTableProps {
  tickets: TicketRow[];
  selectedTicketIds: string[];
  onToggleTicketSelection: (ticketId: string, checked: boolean) => void;
  onToggleSelectAllCurrentPage: (checked: boolean, ticketIdsOnPage: string[]) => void;
}

export function TicketsTable({
  tickets,
  selectedTicketIds,
  onToggleTicketSelection,
  onToggleSelectAllCurrentPage,
}: TicketsTableProps) {
  const navigate = useNavigate();

  return (
    <div className="bg-card rounded-lg border border-border shadow-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="w-12">
              <Checkbox
                className="m-3"
                checked={
                  tickets.length > 0 &&
                  tickets.every((ticket) => selectedTicketIds.includes(ticket.id))
                }
                onCheckedChange={(checked) =>
                  onToggleSelectAllCurrentPage(
                    Boolean(checked),
                    tickets.map((ticket) => ticket.id)
                  )
                }
              />
            </TableHead>
            <TableHead className="w-24">מזהה</TableHead>
            <TableHead>נושא</TableHead>
            <TableHead className="w-40">פונה</TableHead>
            <TableHead className="w-36">מחלקה</TableHead>
            <TableHead className="w-28">סטטוס</TableHead>
            <TableHead className="w-24">עדיפות</TableHead>
            <TableHead className="w-32">משויך ל</TableHead>
            <TableHead className="w-32">נוצר</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {tickets.map((ticket) => (
            <TableRow
              key={ticket.id}
              className="group cursor-pointer"
              data-selected={selectedTicketIds.includes(ticket.id)} onClick={() => navigate(`/tickets/${ticket.id}`)}
            >
              <TableCell onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  className="m-3"
                  checked={selectedTicketIds.includes(ticket.id)}
                  onCheckedChange={(checked) =>
                    onToggleTicketSelection(ticket.id, Boolean(checked))
                  }
                />
              </TableCell>

              <TableCell>
                <Link
                  to={`/tickets/${ticket.id}`}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  {ticket.displayId ?? ticket.id}
                </Link>
              </TableCell>

              <TableCell>
                <Link
                  to={`/tickets/${ticket.id}`}
                  className="block group-hover:text-primary transition-colors"
                >
                  <span className="text-sm font-medium text-foreground line-clamp-1">
                    {ticket.subject}
                  </span>

                  {ticket.isOverdue && (
                    <span className="text-xs text-red-500 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      חריגת SLA
                    </span>
                  )}
                </Link>
              </TableCell>

              <TableCell>
                <div className="flex items-center gap-2">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                      {ticket.requester.initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-foreground">
                    {ticket.requester.name}
                  </span>
                </div>
              </TableCell>

              <TableCell>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Building2 className="w-3.5 h-3.5" />
                  {ticket.department}
                </div>
              </TableCell>

              <TableCell>
                <TicketStatusBadge
                  statusKey={ticket.statusKey ?? ticket.status}
                  label={ticket.statusLabel}
                  color={ticket.statusColor}
                />
              </TableCell>

              <TableCell>
                <TicketPriorityBadge priority={ticket.priority} />
              </TableCell>

              <TableCell>
                {ticket.assignee ? (
                  <div className="flex items-center gap-2">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {ticket.assignee.initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-foreground">
                      {ticket.assignee.name}
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">לא משויך</span>
                )}
              </TableCell>

              <TableCell>
                <span className="text-sm text-muted-foreground">
                  {ticket.createdAt}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}