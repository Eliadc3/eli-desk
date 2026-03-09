import { Button } from "@/components/ui/button";
import type { TicketPriority } from "@/api/tickets";

type StatusOption = {
  id: string;
  labelHe: string;
};

type AssigneeOption = {
  id: string;
  name: string;
};

type TicketBulkActionsProps = {
  selectedCount: number;
  canBulkChangeStatus: boolean;
  canBulkAssign: boolean;
  canBulkChangePriority: boolean;
  canBulkDelete: boolean;
  bulkStatusId: string;
  bulkAssigneeId: string;
  bulkPriority: "" | TicketPriority;
  bulkLoading: boolean;
  statusOptions: StatusOption[];
  assigneeOptions: AssigneeOption[];
  onBulkStatusChange: (value: string) => void;
  onBulkAssigneeChange: (value: string) => void;
  onBulkPriorityChange: (value: "" | TicketPriority) => void;
  onClearSelection: () => void;
  onApply: () => void;
  onDelete: () => void;
};

export function TicketBulkActions(props: TicketBulkActionsProps) {
  if (props.selectedCount <= 0) return null;

  const canApply = Boolean(
    props.bulkStatusId || props.bulkAssigneeId || props.bulkPriority
  );

  return (
    <div className="mt-3 rounded-lg border bg-card p-3">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <span>נבחרו {props.selectedCount} קריאות</span>
          <Button variant="ghost" size="sm" onClick={props.onClearSelection}>
            נקה בחירה
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:flex xl:flex-wrap xl:items-end">
          {props.canBulkChangeStatus && (
            <div className="min-w-[220px]">
              <label className="mb-1 block text-xs text-muted-foreground">שינוי סטטוס</label>
              <select
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={props.bulkStatusId}
                onChange={(e) => props.onBulkStatusChange(e.target.value)}
              >
                <option value="">בחר סטטוס</option>
                {props.statusOptions.map((status) => (
                  <option key={status.id} value={status.id}>
                    {status.labelHe}
                  </option>
                ))}
              </select>
            </div>
          )}

          {props.canBulkAssign && (
            <div className="min-w-[220px]">
              <label className="mb-1 block text-xs text-muted-foreground">שיוך לטכנאי</label>
              <select
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={props.bulkAssigneeId}
                onChange={(e) => props.onBulkAssigneeChange(e.target.value)}
              >
                <option value="">בחר טכנאי</option>
                <option value="unassigned">ללא שיוך</option>
                {props.assigneeOptions.map((assignee) => (
                  <option key={assignee.id} value={assignee.id}>
                    {assignee.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {props.canBulkChangePriority && (
            <div className="min-w-[220px]">
              <label className="mb-1 block text-xs text-muted-foreground">שינוי עדיפות</label>
              <select
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={props.bulkPriority}
                onChange={(e) => props.onBulkPriorityChange(e.target.value as "" | TicketPriority)}
              >
                <option value="">בחר עדיפות</option>
                <option value="LOW">נמוכה</option>
                <option value="MEDIUM">בינונית</option>
                <option value="HIGH">גבוהה</option>
                <option value="URGENT">דחופה</option>
              </select>
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={props.onApply} disabled={props.bulkLoading || !canApply}>
              החל על המסומנות
            </Button>

            {props.canBulkDelete && (
              <Button variant="destructive" onClick={props.onDelete} disabled={props.bulkLoading}>
                מחק מסומנות
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
