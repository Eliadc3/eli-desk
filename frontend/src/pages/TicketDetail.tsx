// src/pages/TicketDetail.tsx
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getTicket, updateTicket } from "@/api/tickets";
import {
  duplicateTicket,
  deleteTicket,
  listAssignees,
  type AssigneeLite,
} from "@/api/admin";
import { hasAnyPermission, useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  CalendarDays,
  ClipboardList,
  UserRound,
  Building2,
  Phone,
  BadgeCheck,
  AlertTriangle,
  Copy,
  Trash2,
  Printer,
  Save,
  ArrowRight,
  X,
  PhoneCallIcon,
  CircleUserRound,
} from "lucide-react";
import { listTicketStatuses } from "@/api/meta";
import { printTicketLabel } from "@/lib/printTicketLabel";
import { listHospitalDepartments } from "@/api/departments";
import { translateBackendError } from "@/utils/backendErrorTranslator";

type TicketStatusDto = {
  id: string;
  key: string;
  labelHe: string;
  color?: string | null;
  sortOrder: number;
  isDefault: boolean;
};

function statusTone(s: string) {
  switch ((s ?? "").toUpperCase()) {
    case "NEW":
      return "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100";
    case "IN_PROGRESS":
      return "bg-blue-100 text-blue-900 dark:bg-blue-900/30 dark:text-blue-100";
    case "WAITING_ON_CUSTOMER":
    case "WAITING":
      return "bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-100";
    case "RESOLVED":
      return "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-100";
    case "CLOSED":
      return "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100";
    default:
      return "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100";
  }
}

function priorityTone(p: string) {
  switch ((p ?? "").toUpperCase()) {
    case "LOW":
      return "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100";
    case "MEDIUM":
      return "bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-100";
    case "HIGH":
      return "bg-orange-100 text-orange-900 dark:bg-orange-900/30 dark:text-orange-100";
    case "URGENT":
      return "bg-rose-100 text-rose-900 dark:bg-rose-900/30 dark:text-rose-100";
    default:
      return "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100";
  }
}

function statusLabelFromAny(s: any): string {
  if (!s) return "—";
  if (typeof s === "string") return s;
  return s.labelHe ?? s.key ?? s.id ?? "—";
}

function statusKeyFromAny(s: any): string {
  if (!s) return "";
  if (typeof s === "string") return s.toUpperCase();
  return String(s.key ?? "").toUpperCase();
}

function formatRequester(t: any) {
  if (!t) return "—";
  if (t.source === "PUBLIC") {
    const name = t.externalRequesterName || "Public";
    const phone = t.externalRequesterPhone ? ` • ${t.externalRequesterPhone}` : "";
    return `${name}${phone}`;
  }
  return t.requester?.name || "—";
}

function makeDraftFromTicket(t: any) {
  return {
    subject: t.subject ?? "",
    description: t.description ?? "",
    statusId: t.statusId ?? t.status?.id ?? "",
    priority: t.priority ?? "",
    assigneeId: t.assigneeId ?? "",
    hospitalDepartmentId: t.hospitalDepartmentId ?? "",
    externalRequesterName: t.externalRequesterName ?? "",
    externalRequesterPhone: t.externalRequesterPhone ?? "",
    notes: t.notes ?? "",
    resolutionSummary: t.resolutionSummary ?? "",
    resolutionDetails: t.resolutionDetails ?? "",
  };
}

// ✅ בלי Hook: חישוב טקסט סטטוס להדר, בטוח בכל רנדר
function computeHeaderStatusLabel(draft: any, statuses: TicketStatusDto[], t: any): string {
  const idFromDraft = draft?.statusId;
  if (idFromDraft) {
    const s = statuses.find((x) => x.id === idFromDraft);
    if (s) return s.labelHe ?? s.key;
  }
  return statusLabelFromAny(t?.status);
}

// ✅ בלי Hook: חישוב key לצבעים/ולוגיקה
function computeCurrentStatusKey(draft: any, statuses: TicketStatusDto[], t: any): string {
  const idFromDraft = draft?.statusId;
  if (idFromDraft) {
    const s = statuses.find((x) => x.id === idFromDraft);
    if (s?.key) return s.key.toUpperCase();
  }
  return statusKeyFromAny(t?.status);
}

export default function TicketDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { me } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const statusesQ = useQuery({
    queryKey: ["meta-ticket-statuses"],
    queryFn: () => listTicketStatuses(),
    staleTime: 1000 * 60 * 60,
  });

  const STATUSES = (statusesQ.data ?? []) as TicketStatusDto[];

  const deptsQ = useQuery({
    queryKey: ["meta-hospital-departments"],
    queryFn: listHospitalDepartments,
    staleTime: 1000 * 60 * 60,
  });

  const q = useQuery({
    queryKey: ["ticket", id],
    queryFn: () => getTicket(String(id)),
    enabled: !!id,
  });

  const t = q.data as any;
  const [draft, setDraft] = useState<any>(null);

  useEffect(() => {
    if (!t) return;
    setDraft(makeDraftFromTicket(t));
  }, [t]);

  const canDelete = hasAnyPermission(me, ["TICKET_DELETE"]);
  const canDup = hasAnyPermission(me, ["TICKET_DUPLICATE"]);
  const canReassign = hasAnyPermission(me, ["TICKET_REASSIGN"]);
  const canEdit = !!me && me.role !== "CUSTOMER";

  const assigneesQ = useQuery({
    queryKey: ["assignees-lite"],
    queryFn: () => listAssignees(),
    enabled: !!id && canReassign,
  });
  const assignees = (assigneesQ.data ?? []) as AssigneeLite[];

  const currentAssigneeLabel = useMemo(() => {
    if (!t?.assignee?.name) return "Unassigned";
    return t.assignee.name;
  }, [t]);

  const departmentName =
    (deptsQ.data ?? []).find((d: any) => d.id === t?.hospitalDepartmentId)?.name ?? "—";

  const saveM = useMutation({
    mutationFn: (payload: any) => updateTicket(String(id), payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["ticket", id] });
      await q.refetch();
      toast({ title: "Saved" });
    },
    onError: (e: any) => {
      const status = e?.response?.status;
      const data = e?.response?.data;

      let rawMsg: string | null = null;

      if (data && typeof data === "object") {
        if (typeof data.error === "string") rawMsg = data.error;
        else if (typeof data.message === "string") rawMsg = data.message;
        else if (Array.isArray((data as any).issues)) {
          rawMsg = (data as any).issues.map((x: any) => `${x.path}: ${x.message}`).join("\n");
        }
      }

      if (!rawMsg && typeof data === "string") rawMsg = data;
      if (!rawMsg) rawMsg = e?.message ?? "שגיאה לא ידועה";

      toast({
        title: `שמירה נכשלה${status ? ` (${status})` : ""}`,
        description: translateBackendError(rawMsg),
        variant: "destructive",
      });
    },
  });

  // ✅ כל החישובים האלה בלי Hooks -> אין שינוי סדר Hooks
  const currentStatusKey = computeCurrentStatusKey(draft, STATUSES, t);
  const headerStatusLabel = computeHeaderStatusLabel(draft, STATUSES, t);

  const isClosingStatus = (s: string) => ["RESOLVED", "CLOSED"].includes((s ?? "").toUpperCase());

  function validateBeforeSave(d: any): string | null {
    if (!isClosingStatus(currentStatusKey)) return null;

    const summary = (d?.resolutionSummary ?? "").trim();
    if (summary.length < 4) return "כדי לסגור/לפתור קריאה, חייב למלא 'סיכום פתרון' (לפחות 4 תווים).";

    return null;
  }

  if (q.isLoading) {
    return (
      <MainLayout>
        <div>Loading...</div>
      </MainLayout>
    );
  }

  if (!t) {
    return (
      <MainLayout>
        <div>Not found</div>
      </MainLayout>
    );
  }

  const statusBadgeClass = statusTone(currentStatusKey);
  const priorityBadgeClass = priorityTone(t.priority);

  return (
    <MainLayout>
      <div className="space-y-5">
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-slate-50 to-white dark:from-slate-900/60 dark:to-slate-950 border-b">
            <div className="p-4 md:p-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="text-xl md:text-2xl font-bold">Ticket #{t.number}</div>

                  <Badge className={`border-0 ${statusBadgeClass}`}>{headerStatusLabel}</Badge>

                  <Badge className={`border-0 ${priorityBadgeClass}`}>{t.priority}</Badge>

                  {t.source === "PUBLIC" ? (
                    <Badge variant="outline" className="gap-1">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      PUBLIC
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="gap-1">
                      <BadgeCheck className="h-3.5 w-3.5" />
                      INTERNAL
                    </Badge>
                  )}
                </div>

                <div className="mt-1 truncate text-muted-foreground">{t.subject}</div>
              </div>

              <div className="grid mt-3 flex items-center gap-3 flex-wrap">
                <div className="flex gap-2 flex-wrap">
                  <Button variant="outline" onClick={() => nav("/tickets")} className="gap-2">
                    חזור
                    <ArrowRight className="h-4 w-4" />
                  </Button>

                  {canEdit && (
                    <>
                      <Button
                        disabled={!draft || saveM.isPending}
                        onClick={() => {
                          if (!draft) return;

                          const err = validateBeforeSave(draft);
                          if (err) {
                            toast({ title: "Cannot save", description: err, variant: "destructive" });
                            return;
                          }

                          saveM.mutate({
                            subject: draft.subject,
                            description: draft.description,
                            statusId: draft.statusId || null,
                            priority: draft.priority,
                            assigneeId: draft.assigneeId || null,
                            hospitalDepartmentId: draft.hospitalDepartmentId || null,
                            notes: draft.notes,
                            resolutionSummary: draft.resolutionSummary,
                            resolutionDetails: draft.resolutionDetails,
                            externalRequesterName: draft.externalRequesterName,
                            externalRequesterPhone: draft.externalRequesterPhone,
                          });
                        }}
                      >
                        שמור
                        <Save className="h-4 w-4 mr-1" />
                      </Button>

                      <Button
                        variant="outline"
                        disabled={!draft || saveM.isPending}
                        onClick={() => setDraft(makeDraftFromTicket(t))}
                        className="gap-2"
                      >
                        ביטול
                        <X className="h-4 w-4 mr-1" />
                      </Button>
                    </>
                  )}
                </div>

                {canDup && (
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={async () => {
                      try {
                        const copy = await duplicateTicket(String(id));
                        toast({ title: "Duplicated" });
                        nav(`/tickets/${copy.id}`);
                      } catch (e: any) {
                        toast({
                          title: "Failed",
                          description: e?.response?.data?.message ?? e?.message,
                          variant: "destructive",
                        });
                      }
                    }}
                  >
                    שכפל קריאה
                    <Copy className="h-4 w-4" />
                  </Button>
                )}

                <Button
                  onClick={() => {
                    if (!t) return;

                    printTicketLabel({
                      number: t.number,
                      department: t.hospitalDepartment?.name,
                      requester: t.externalRequesterName,
                      assignee: t.assignee?.name,
                      createdAt: t.createdAt,
                      subject: t.subject,
                      description: t.description,
                    });
                  }}
                  className="bg-blue-600 text-white px-3 py-1 rounded"
                >
                  הדפס מדבקה
                  <Printer className="h-4 w-4 mr-1" />
                </Button>

                {canDelete && (
                  <Button
                    variant="destructive"
                    className="gap-2"
                    onClick={async () => {
                      if (!confirm("Delete ticket?")) return;
                      try {
                        await deleteTicket(String(id));
                        toast({ title: "Deleted" });
                        nav("/tickets");
                      } catch (e: any) {
                        toast({
                          title: "Failed",
                          description: e?.response?.data?.message ?? e?.message,
                          variant: "destructive",
                        });
                      }
                    }}
                  >
                    מחיקת הקריאה
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                פרטים
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="rounded-xl border bg-card p-3 space-y-3">
                <div className="grid grid-cols-1 gap-3">
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-muted-foreground">STATUS</div>
                    {canEdit ? (
                      <Select
                        value={draft?.statusId ?? t.statusId ?? t.status?.id ?? ""}
                        onValueChange={(v) => setDraft((prev: any) => ({ ...prev, statusId: v }))}
                      >
                        <SelectTrigger className="w-full" dir="rtl">
                          <SelectValue placeholder="בחר סטטוס" />
                        </SelectTrigger>

                        <SelectContent dir="rtl">
                          {statusesQ.isLoading && (
                            <SelectItem value="__loading__" disabled>
                              טוען...
                            </SelectItem>
                          )}

                          {!statusesQ.isLoading &&
                            STATUSES.map((s) => (
                              <SelectItem key={s.id} value={s.id}>
                                {s.labelHe}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="text-sm">{headerStatusLabel}</div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs font-medium text-muted-foreground">ASSIGNEE</div>

                    {canReassign ? (
                      <Select
                        value={draft?.assigneeId ?? ""}
                        onValueChange={(v) =>
                          setDraft((prev: any) => ({
                            ...prev,
                            assigneeId: v === "__none__" ? "" : v,
                          }))
                        }
                      >
                        <SelectTrigger className="w-full" dir="rtl">
                          <SelectValue placeholder="Select technician" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">Unassigned</SelectItem>
                          {assignees.map((u) => (
                            <SelectItem key={u.id} value={u.id}>
                              {u.name} ({u.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="text-sm flex items-center gap-2">
                        <UserRound className="h-4 w-4 text-muted-foreground" />
                        {currentAssigneeLabel}
                      </div>
                    )}

                    {canReassign && (
                      <div className="text-[11px] text-muted-foreground">
                        שינוי הטכנאי נשמר רק בלחיצה על <b>שמור</b>.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="min-w-0">
                    <div className="text-xs mb-1 text-muted-foreground">מחלקה מדווחת</div>

                    {canEdit ? (
                      <Select
                        value={draft?.hospitalDepartmentId ?? t.hospitalDepartmentId ?? ""}
                        onValueChange={(v) =>
                          setDraft((prev: any) => ({ ...prev, hospitalDepartmentId: v }))
                        }
                      >
                        <SelectTrigger className="w-full" dir="rtl">
                          <SelectValue placeholder="בחר מחלקה" />
                        </SelectTrigger>
                        <SelectContent dir="rtl">
                          {(deptsQ.data ?? []).map((d: any) => (
                            <SelectItem key={d.id} value={d.id}>
                              {d.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="font-medium truncate">
                        {t.hospitalDepartment?.name ?? departmentName}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <UserRound className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="min-w-0 w-full">
                    <div className="text-xs mb-1 text-muted-foreground">פותח הקריאה</div>

                    {canEdit ? (
                      <div className="space-y-2">
                        <div className="relative">
                          <CircleUserRound className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            value={draft?.externalRequesterName ?? ""}
                            onChange={(e) =>
                              setDraft((prev: any) => ({
                                ...prev,
                                externalRequesterName: e.target.value,
                              }))
                            }
                            placeholder="שם"
                            className="pr-10"
                          />
                        </div>

                        <div className="relative">
                          <PhoneCallIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            value={draft?.externalRequesterPhone ?? ""}
                            onChange={(e) =>
                              setDraft((prev: any) => ({
                                ...prev,
                                externalRequesterPhone: e.target.value,
                              }))
                            }
                            placeholder="טלפון"
                            className="pr-10"
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="font-medium break-words">{formatRequester(t)}</div>

                        {t.source === "PUBLIC" && (
                          <div className="mt-1 space-y-1 text-xs text-muted-foreground">
                            {t.externalRequesterPhone && (
                              <div className="flex items-center gap-2">
                                <Phone className="h-3.5 w-3.5" />
                                <span>{t.externalRequesterPhone}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <CalendarDays className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="min-w-0">
                    <div className="text-xs text-muted-foreground">נפתחה ב:</div>
                    <div className="font-medium">{new Date(t.createdAt).toLocaleString("he")}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      עודכן: {new Date(t.updatedAt).toLocaleString("he")}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>תוכן הקריאה</CardTitle>
                <CardDescription>נערך ונשמר רק בלחיצה על “שמור”</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">נושא</label>
                  <Input
                    disabled={!canEdit}
                    value={draft?.subject ?? ""}
                    onChange={(e) => setDraft((prev: any) => ({ ...prev, subject: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">תיאור</label>
                  <Textarea
                    disabled={!canEdit}
                    value={draft?.description ?? ""}
                    onChange={(e) =>
                      setDraft((prev: any) => ({ ...prev, description: e.target.value }))
                    }
                    rows={10}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>פתרון</CardTitle>
                <CardDescription>סיכום + פרטים (פנימי) — נשמר רק בלחיצה על “שמור”</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">סיכום</label>
                  <Input
                    disabled={!canEdit}
                    value={draft?.resolutionSummary ?? ""}
                    onChange={(e) =>
                      setDraft((prev: any) => ({ ...prev, resolutionSummary: e.target.value }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">פתרון מורחב</label>
                  <Textarea
                    disabled={!canEdit}
                    value={draft?.resolutionDetails ?? ""}
                    onChange={(e) =>
                      setDraft((prev: any) => ({ ...prev, resolutionDetails: e.target.value }))
                    }
                    rows={7}
                  />
                </div>
              </CardContent>
            </Card>

            {me?.role !== "CUSTOMER" && (
              <Card>
                <CardHeader>
                  <CardTitle>הערות</CardTitle>
                  <CardDescription>הערות פנימיות — נשמרות רק בלחיצה על “שמור”</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Textarea
                    value={draft?.notes ?? ""}
                    onChange={(e) => setDraft((prev: any) => ({ ...prev, notes: e.target.value }))}
                    rows={7}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
