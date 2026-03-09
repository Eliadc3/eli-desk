import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Permission } from "@/api/auth";
import type { Dispatch, SetStateAction } from "react";
import { PERM_GROUPS, type ActiveView } from "../utils/adminConstants";
import { PermissionGroupCard } from "./PermissionGroupCard";

interface TechniciansSectionProps {
  canTech: boolean;
  newTech: any;
  setNewTech: (value: any) => void;
  techDepts: { id: string; name: string }[];
  canCreateTech: boolean;
  onCreateTechnician: () => void;
  techSearch: string;
  onTechSearchChange: (value: string) => void;
  techView: ActiveView;
  onTechViewChange: (value: ActiveView) => void;
  techQuery: string;
  techsToRender: any[];
  isTechActive: (technician: any) => boolean;
  techActiveFlag: boolean;
  permDraft: Record<string, Permission[]>;
  setPermDraft: Dispatch<SetStateAction<Record<string, Permission[]>>>;
  permDirty: Record<string, boolean>;
  setPermDirty: Dispatch<SetStateAction<Record<string, boolean>>>;
  techDeptDraft: Record<string, string>;
  setTechDeptDraft: Dispatch<SetStateAction<Record<string, string>>>;
  techDeptDirty: Record<string, boolean>;
  setTechDeptDirty: Dispatch<SetStateAction<Record<string, boolean>>>;
  onRename: (technician: any) => void;
  onDisable: (technicianId: string) => void;
  onEnable: (technician: any) => void;
  onDeletePermanent: (technician: any) => void;
  onSave: (technician: any) => void;
  onRollback: (technician: any) => void;
}

export function TechniciansSection(props: TechniciansSectionProps) {
  if (!props.canTech) {
    return (
      <Card>
        <CardContent className="p-6">אין הרשאות לניהול טכנאים</CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle>צור טכנאי</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4" dir="rtl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">שם</label>
              <Input placeholder="שם" value={props.newTech.name} onChange={(e) => props.setNewTech({ ...props.newTech, name: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">שם משתמש</label>
              <Input placeholder="שם משתמש" value={props.newTech.username} onChange={(e) => props.setNewTech({ ...props.newTech, username: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">סיסמה</label>
              <Input placeholder="סיסמה" type="password" value={props.newTech.password} onChange={(e) => props.setNewTech({ ...props.newTech, password: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
            <div className="rounded-xl border bg-muted/30 p-4 space-y-2">
              <div className="text-xs text-muted-foreground">מחלקה</div>
              <select className="border rounded-md p-2 bg-background w-full" value={props.newTech.techDepartmentId} onChange={(e) => props.setNewTech({ ...props.newTech, techDepartmentId: e.target.value })}>
                <option value="">בחר מחלקה</option>
                {props.techDepts.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
              </select>
              <div className="text-[11px] text-muted-foreground">חובה לבחור מחלקה לפני יצירת טכנאי</div>
            </div>

            <PermissionGroupCard
              title={PERM_GROUPS[0].title}
              items={PERM_GROUPS[0].items}
              values={props.newTech.permissions ?? []}
              onChange={(permissions) => props.setNewTech({ ...props.newTech, permissions })}
            />

            <PermissionGroupCard
              title={PERM_GROUPS[1].title}
              items={PERM_GROUPS[1].items}
              values={props.newTech.permissions ?? []}
              onChange={(permissions) => props.setNewTech({ ...props.newTech, permissions })}
            />
          </div>

          <div className="space-y-2">
            <Button className="w-full" disabled={!props.canCreateTech} onClick={props.onCreateTechnician}>הוסף טכנאי</Button>
            {!props.canCreateTech && <div className="text-xs text-muted-foreground text-center">יש למלא שם, שם משתמש, סיסמה ולבחור מחלקה</div>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>רשימת טכנאים</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="חיפוש טכנאי (שם / שם משתמש / מחלקה)..." value={props.techSearch} onChange={(e) => props.onTechSearchChange(e.target.value)} />

          <div className="flex gap-2">
            <Button variant={props.techView === "active" ? "default" : "outline"} onClick={() => props.onTechViewChange("active")}>פעיל</Button>
            <Button variant={props.techView === "archived" ? "default" : "outline"} onClick={() => props.onTechViewChange("archived")}>לא פעיל</Button>
          </div>

          {props.techQuery && props.techsToRender.length === 0 ? (
            <div className="text-sm text-muted-foreground">לא נמצאו תוצאות</div>
          ) : (
            props.techsToRender.map((technician) => {
              const permsIsDirty = Boolean(props.permDirty[technician.id]);
              const deptIsDirty = Boolean(props.techDeptDirty[technician.id]);
              const anyDirty = permsIsDirty || deptIsDirty;
              const canSave = anyDirty && (!deptIsDirty || String(props.techDeptDraft[technician.id] ?? "").trim().length > 0);
              const draftPerms = props.permDraft[technician.id] ?? [];

              return (
                <div id={`tech-${technician.id}`} key={technician.id} className="border rounded-xl p-4 space-y-4 bg-background" dir="rtl">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-semibold truncate">{technician.name}
                          <span className={`m-2 text-xs px-2 py-1 rounded-full border ${props.isTechActive(technician) ? "text-green-700 bg-green-50 border-green-200" : "text-red-700 bg-red-50 border-red-200"}`}>{props.isTechActive(technician) ? "פעיל" : "לא פעיל"}</span>
                        </div>
                        <div className="mt-1 text-xs opacity-70 truncate">שם משתמש: {technician.username ?? "-"}</div>
                        <div className="mt-1 text-xs opacity-70 truncate">מחלקה נוכחית: {technician.techDepartment?.name ?? "-"}</div>
                      </div>
                    </div>

                    {anyDirty && (
                      <div className="pt-2 text-[11px] text-amber-700">
                        יש שינויים שלא נשמרו
                        {deptIsDirty ? " (מחלקה)" : ""}
                        {permsIsDirty ? " (הרשאות)" : ""}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
                    <div className="rounded-xl border bg-muted/30 p-4 space-y-2">
                      <div className="text-xs text-muted-foreground">שינוי מחלקה</div>
                      <select className="border rounded-md p-2 bg-background w-full" value={props.techDeptDraft[technician.id] ?? ""} onChange={(e) => { const value = e.target.value; props.setTechDeptDraft((prev) => ({ ...prev, [technician.id]: value })); props.setTechDeptDirty((prev) => ({ ...prev, [technician.id]: true })); }}>
                        <option value="" disabled>בחר מחלקה</option>
                        {props.techDepts.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
                      </select>
                      <div className="text-[11px] text-muted-foreground">השינוי יישמר בלחיצה על “שמור”</div>
                    </div>

                    <PermissionGroupCard
                      title={PERM_GROUPS[0].title}
                      items={PERM_GROUPS[0].items}
                      values={draftPerms}
                      onChange={(next) => { props.setPermDraft((prev) => ({ ...prev, [technician.id]: next })); props.setPermDirty((prev) => ({ ...prev, [technician.id]: true })); }}
                    />

                    <PermissionGroupCard
                      title={PERM_GROUPS[1].title}
                      items={PERM_GROUPS[1].items}
                      values={draftPerms}
                      onChange={(next) => { props.setPermDraft((prev) => ({ ...prev, [technician.id]: next })); props.setPermDirty((prev) => ({ ...prev, [technician.id]: true })); }}
                    />
                  </div>

                  <div className="flex flex-wrap gap-2 border-t pt-3">
                    <Button variant="outline" onClick={() => props.onRename(technician)}>שנה שם</Button>
                    {props.techActiveFlag ? (
                      <Button variant="destructive" onClick={() => props.onDisable(technician.id)}>השבת</Button>
                    ) : (
                      <>
                        <Button onClick={() => props.onEnable(technician)}>הפעל</Button>
                        <Button variant="destructive" onClick={() => props.onDeletePermanent(technician)}>מחק</Button>
                      </>
                    )}
                    <Button className={`text-white ${canSave ? "bg-green-600 hover:bg-green-700" : "bg-green-300 cursor-not-allowed"}`} disabled={!canSave} onClick={() => props.onSave(technician)}>שמור</Button>
                    <Button variant="outline" disabled={!anyDirty} onClick={() => props.onRollback(technician)}>ביטול</Button>
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
