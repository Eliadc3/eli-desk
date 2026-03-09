import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import type { ActiveView } from "../utils/adminConstants";

interface StatusesSectionProps {
  canStatuses: boolean;
  newStatus: any;
  setNewStatus: (value: any) => void;
  canCreateStatus: boolean;
  onCreateStatus: () => void;
  statusSearch: string;
  onStatusSearchChange: (value: string) => void;
  statusView: ActiveView;
  onStatusViewChange: (value: ActiveView) => void;
  statusQuery: string;
  statusesToRender: any[];
  statusDraft: Record<string, any>;
  statusDirty: Record<string, boolean>;
  updateStatusField: (statusId: string, patch: Record<string, any>) => void;
  saveStatusChanges: (status: any) => void;
  rollbackStatusChanges: (status: any) => void;
  disableStatusHandler: (statusId: string) => void;
  enableStatusHandler: (statusId: string) => void;
}

export function StatusesSection(props: StatusesSectionProps) {
  if (!props.canStatuses) {
    return (
      <Card>
        <CardContent className="p-6">אין הרשאות לניהול סטטוסים</CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle>צור סטטוס קריאה</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-[1fr_2fr_2fr_1fr_auto] gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">ID</label>
            <Input type="number" placeholder="ID" value={String(props.newStatus.sortOrder ?? 0)} onChange={(e) => props.setNewStatus({ ...props.newStatus, sortOrder: Number(e.target.value) })} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">מפתח (KEY)</label>
            <Input placeholder="מפתח (KEY)" value={props.newStatus.key} onChange={(e) => props.setNewStatus({ ...props.newStatus, key: e.target.value.toUpperCase() })} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">שם בעברית</label>
            <Input placeholder="שם בעברית" value={props.newStatus.labelHe} onChange={(e) => props.setNewStatus({ ...props.newStatus, labelHe: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">צבע</label>
            <Input type="color" value={props.newStatus.color || "#3B82F6"} onChange={(e) => props.setNewStatus({ ...props.newStatus, color: e.target.value })} className="h-10 p-1" />
          </div>
          <div className="flex flex-col gap-1 w-fit">
            <label className="text-xs text-muted-foreground">ברירת מחדל</label>
            <div className="h-10 flex items-center">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={Boolean(props.newStatus.isDefault)} onCheckedChange={(value) => props.setNewStatus({ ...props.newStatus, isDefault: Boolean(value) })} />
                כן
              </label>
            </div>
          </div>

          <Button className="md:col-span-6" disabled={!props.canCreateStatus} onClick={props.onCreateStatus}>הוסף סטטוס</Button>
          {!props.canCreateStatus && <div className="flex text-xs text-muted-foreground text-center">יש למלא Key, שם סטטוס, צבע ו-ID</div>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>כל סטטוסי הקריאות</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="חיפוש סטטוס (Key / שם בעברית)..." value={props.statusSearch} onChange={(e) => props.onStatusSearchChange(e.target.value)} />
          <div className="flex gap-2">
            <Button variant={props.statusView === "active" ? "default" : "outline"} onClick={() => props.onStatusViewChange("active")}>פעיל</Button>
            <Button variant={props.statusView === "archived" ? "default" : "outline"} onClick={() => props.onStatusViewChange("archived")}>לא פעיל</Button>
          </div>

          {props.statusQuery && props.statusesToRender.length === 0 ? (
            <div className="text-sm text-muted-foreground">לא נמצאו תוצאות</div>
          ) : (
            props.statusesToRender.map((status) => {
              const draft = props.statusDraft[status.id] ?? status;
              const dirty = Boolean(props.statusDirty[status.id]);
              return (
                <div id={`status-${status.id}`} key={status.id} className="border rounded-md p-3 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_0.5fr_0.5fr_0.5fr_auto] gap-4 items-end">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-muted-foreground">Key</label>
                      <Input value={String(draft.key ?? "")} onChange={(e) => props.updateStatusField(status.id, { key: e.target.value.toUpperCase() })} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-muted-foreground">שם סטטוס</label>
                      <Input value={String(draft.labelHe ?? "")} onChange={(e) => props.updateStatusField(status.id, { labelHe: e.target.value })} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-muted-foreground">צבע</label>
                      <Input type="color" value={String(draft.color ?? "#6B7280")} onChange={(e) => props.updateStatusField(status.id, { color: e.target.value })} className="h-10 p-1" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-muted-foreground">ID</label>
                      <Input type="number" value={String(draft.sortOrder ?? 0)} onChange={(e) => props.updateStatusField(status.id, { sortOrder: Number(e.target.value) })} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-muted-foreground">ברירת מחדל</label>
                      <div className="h-10 flex items-center">
                        <label className="flex items-center gap-2 text-sm">
                          <Checkbox checked={Boolean(draft.isDefault)} onCheckedChange={(value) => props.updateStatusField(status.id, { isDefault: Boolean(value) })} />
                          כן
                        </label>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button disabled={!dirty} onClick={() => props.saveStatusChanges(status)}>שמור</Button>
                      <Button variant="outline" disabled={!dirty} onClick={() => props.rollbackStatusChanges(status)}>ביטול</Button>
                      {Boolean(draft.isActive) ? (
                        <Button variant="destructive" disabled={Boolean(draft.isDefault)} title={draft.isDefault ? "לא ניתן להשבית סטטוס ברירת מחדל" : undefined} onClick={() => props.disableStatusHandler(status.id)}>השבת</Button>
                      ) : (
                        <Button onClick={() => props.enableStatusHandler(status.id)}>הפעל</Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
