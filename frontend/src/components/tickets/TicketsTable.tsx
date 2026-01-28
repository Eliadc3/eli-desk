import { useState } from "react";
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
  displayId?: string;
  subject: string;
  requester: {
    name: string;
    initials: string;
  };
  department: string;
  status: TicketStatus;
  priority: TicketPriority;
  assignee?: {
    name: string;
    initials: string;
  };
  createdAt: string;
  slaDeadline?: string;
  isOverdue?: boolean;
}

export type TicketStatus =
  | "new"
  | "in-progress"
  | "waiting-on-customer"
  | "resolved"
  | "closed";

export type TicketPriority =
  | "low"
  | "medium"
  | "high"
  | "urgent";


interface TicketsTableProps {
  tickets: TicketRow[];
  onSelect?: (ids: string[]) => void;
}

export function TicketsTable({ tickets, onSelect }: TicketsTableProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const navigate = useNavigate();
  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
    onSelect?.(Array.from(newSelected));
  };

  const toggleAll = () => {
    if (selectedIds.size === tickets.length) {
      setSelectedIds(new Set());
      onSelect?.([]);
    } else {
      const allIds = new Set(tickets.map((t) => t.id));
      setSelectedIds(allIds);
      onSelect?.(Array.from(allIds));
    }
  };

  return (
    <div className="bg-card rounded-lg border border-border shadow-card overflow-hidden">
      <Table>
        <TableHeader >
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="w-12">
              <Checkbox className="m-3" 
                checked={selectedIds.size === tickets.length && tickets.length > 0}
                onCheckedChange={toggleAll}
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
              data-selected={selectedIds.has(ticket.id)}
              onClick={() => navigate(`/tickets/${ticket.id}`)}
            >
              <TableCell onClick={(e) => e.stopPropagation()}>
                <Checkbox className="m-3"
                  checked={selectedIds.has(ticket.id)}
                  onCheckedChange={() => toggleSelect(ticket.id)}
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
                <TicketStatusBadge status={ticket.status} />
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
