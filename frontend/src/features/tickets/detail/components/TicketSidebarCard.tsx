import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Building2, CalendarDays, CircleUserRound, ClipboardList, Phone, PhoneCallIcon, UserRound } from "lucide-react";
import { formatRequester } from "../utils/ticketDetailHelpers";

interface TicketSidebarCardProps {
  ticket: any;
  draft: any;
  setDraft: (updater: any) => void;
  canEdit: boolean;
  canReassign: boolean;
  statusesQ: any;
  statuses: any[];
  headerStatusLabel: string;
  assignees: any[];
  currentAssigneeLabel: string;
  departments: any[];
  departmentName: string;
}

export function TicketSidebarCard(props: TicketSidebarCardProps) {
  return (
    <Card className="lg:col-span-1">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><ClipboardList className="h-5 w-5" />פרטים</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-xl border bg-card p-3 space-y-3">
          <div className="grid grid-cols-1 gap-3">
            <div className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground">STATUS</div>
              {props.canEdit ? (
                <Select value={props.draft?.statusId ?? props.ticket.statusId ?? props.ticket.status?.id ?? ""} onValueChange={(value) => props.setDraft((prev: any) => ({ ...prev, statusId: value }))}>
                  <SelectTrigger className="w-full" dir="rtl"><SelectValue placeholder="בחר סטטוס" /></SelectTrigger>
                  <SelectContent dir="rtl">
                    {props.statusesQ.isLoading && <SelectItem value="__loading__" disabled>טוען...</SelectItem>}
                    {!props.statusesQ.isLoading && props.statuses.map((status) => <SelectItem key={status.id} value={status.id}>{status.labelHe}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : <div className="text-sm">{props.headerStatusLabel}</div>}
            </div>

            <div className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground">ASSIGNEE</div>
              {props.canReassign ? (
                <Select value={props.draft?.assigneeId ?? ""} onValueChange={(value) => props.setDraft((prev: any) => ({ ...prev, assigneeId: value === "__none__" ? "" : value }))}>
                  <SelectTrigger className="w-full" dir="rtl"><SelectValue placeholder="Select technician" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Unassigned</SelectItem>
                    {props.assignees.map((user) => <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : <div className="text-sm flex items-center gap-2"><UserRound className="h-4 w-4 text-muted-foreground" />{props.currentAssigneeLabel}</div>}
              {props.canReassign && <div className="text-[11px] text-muted-foreground">שינוי הטכנאי נשמר רק בלחיצה על <b>שמור</b>.</div>}
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div className="min-w-0">
              <div className="text-xs mb-1 text-muted-foreground">מחלקה מדווחת</div>
              {props.canEdit ? (
                <Select value={props.draft?.hospitalDepartmentId ?? props.ticket.hospitalDepartmentId ?? ""} onValueChange={(value) => props.setDraft((prev: any) => ({ ...prev, hospitalDepartmentId: value }))}>
                  <SelectTrigger className="w-full" dir="rtl"><SelectValue placeholder="בחר מחלקה" /></SelectTrigger>
                  <SelectContent dir="rtl">{props.departments.map((department) => <SelectItem key={department.id} value={department.id}>{department.name}</SelectItem>)}</SelectContent>
                </Select>
              ) : <div className="font-medium truncate">{props.ticket.hospitalDepartment?.name ?? props.departmentName}</div>}
            </div>
          </div>

          <div className="flex items-start gap-2">
            <UserRound className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div className="min-w-0 w-full">
              <div className="text-xs mb-1 text-muted-foreground">פותח הקריאה</div>
              {props.canEdit ? (
                <div className="space-y-2">
                  <div className="relative">
                    <CircleUserRound className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input value={props.draft?.externalRequesterName ?? ""} onChange={(e) => props.setDraft((prev: any) => ({ ...prev, externalRequesterName: e.target.value }))} placeholder="שם" className="pr-10" />
                  </div>
                  <div className="relative">
                    <PhoneCallIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input value={props.draft?.externalRequesterPhone ?? ""} onChange={(e) => props.setDraft((prev: any) => ({ ...prev, externalRequesterPhone: e.target.value }))} placeholder="טלפון" className="pr-10" />
                  </div>
                </div>
              ) : (
                <>
                  <div className="font-medium break-words">{formatRequester(props.ticket)}</div>
                  {props.ticket.source === "PUBLIC" && props.ticket.externalRequesterPhone && <div className="mt-1 space-y-1 text-xs text-muted-foreground"><div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /><span>{props.ticket.externalRequesterPhone}</span></div></div>}
                </>
              )}
            </div>
          </div>

          <div className="flex items-start gap-2">
            <CalendarDays className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div className="min-w-0">
              <div className="text-xs text-muted-foreground">נפתחה ב:</div>
              <div className="font-medium">{new Date(props.ticket.createdAt).toLocaleString("he")}</div>
              <div className="text-xs text-muted-foreground mt-1">עודכן: {new Date(props.ticket.updatedAt).toLocaleString("he")}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
