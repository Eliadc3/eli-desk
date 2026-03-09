import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TicketStatusBadge } from "@/components/tickets/TicketStatusBadge";
import { AlertTriangle, ArrowRight, BadgeCheck, Copy, Printer, Save, Trash2, X } from "lucide-react";

interface TicketDetailHeaderProps {
  ticket: any;
  canEdit: boolean;
  canDuplicate: boolean;
  canDelete: boolean;
  draft: any;
  savePending: boolean;
  headerStatusLabel: string;
  currentStatusKey: string;
  headerStatusColor: string | null;
  priorityBadgeClass: string;
  onBack: () => void;
  onSave: () => void;
  onCancel: () => void;
  onDuplicate: () => void;
  onPrint: () => void;
  onDelete: () => void;
}

export function TicketDetailHeader(props: TicketDetailHeaderProps) {
  const { ticket } = props;
  return (
    <Card className="overflow-hidden">
      <div className="bg-gradient-to-r from-slate-50 to-white dark:from-slate-900/60 dark:to-slate-950 border-b">
        <div className="p-4 md:p-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="text-xl md:text-2xl font-bold">Ticket #{ticket.number}</div>
              <TicketStatusBadge statusKey={props.currentStatusKey} label={props.headerStatusLabel} color={props.headerStatusColor} />
              <Badge className={`border-0 ${props.priorityBadgeClass}`}>{ticket.priority}</Badge>
              {ticket.source === "PUBLIC" ? (
                <Badge variant="outline" className="gap-1"><AlertTriangle className="h-3.5 w-3.5" />PUBLIC</Badge>
              ) : (
                <Badge variant="outline" className="gap-1"><BadgeCheck className="h-3.5 w-3.5" />INTERNAL</Badge>
              )}
            </div>
            <div className="mt-1 truncate text-muted-foreground">{ticket.subject}</div>
          </div>

          <div className="grid mt-3 flex items-center gap-3 flex-wrap">
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" onClick={props.onBack} className="gap-2">חזור<ArrowRight className="h-4 w-4" /></Button>
              {props.canEdit && (
                <>
                  <Button disabled={!props.draft || props.savePending} onClick={props.onSave}>שמור<Save className="h-4 w-4 mr-1" /></Button>
                  <Button variant="outline" disabled={!props.draft || props.savePending} onClick={props.onCancel} className="gap-2">ביטול<X className="h-4 w-4 mr-1" /></Button>
                </>
              )}
            </div>
            {props.canDuplicate && <Button variant="outline" className="gap-2" onClick={props.onDuplicate}>שכפל קריאה<Copy className="h-4 w-4" /></Button>}
            <Button onClick={props.onPrint} className="bg-blue-600 text-white px-3 py-1 rounded">הדפס מדבקה<Printer className="h-4 w-4 mr-1" /></Button>
            {props.canDelete && <Button variant="destructive" className="gap-2" onClick={props.onDelete}>מחיקת הקריאה<Trash2 className="h-4 w-4" /></Button>}
          </div>
        </div>
      </div>
    </Card>
  );
}
