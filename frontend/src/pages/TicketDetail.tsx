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
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getTicket, updateTicket } from "@/api/tickets";
import {
  duplicateTicket,
  deleteTicket,
  reassignTicket,
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
  Mail,
  Phone,
  BadgeCheck,
  AlertTriangle,
  ArrowLeft,
  Copy,
  Trash2,
} from "lucide-react";
import { listTicketStatuses } from "@/api/meta";
import { printTicketLabel } from "@/lib/printTicketLabel";
import { listHospitalDepartments } from "@/api/departments";

const STATUS_STALE_TIME = 1000 * 60 * 60;


function statusTone(s: string) {
  switch (s) {
    case "NEW":
      return "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100";
    case "IN_PROGRESS":
      return "bg-blue-100 text-blue-900 dark:bg-blue-900/30 dark:text-blue-100";
    case "WAITING_ON_CUSTOMER":
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
  switch (p) {
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

function formatRequester(t: any) {
  if (!t) return "—";
  if (t.source === "PUBLIC") {
    const name = t.externalRequesterName || "Public";
    const email = t.externalRequesterEmail ? ` • ${t.externalRequesterEmail}` : "";
    const phone = t.externalRequesterPhone ? ` • ${t.externalRequesterPhone}` : "";
    return `${name}${email}${phone}`;
  }
  return t.requester?.name || t.requester?.email || "—";
}

export default function TicketDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { me } = useAuth();
  const { toast } = useToast();

  const statusesQ = useQuery({
    queryKey: ["meta-ticket-statuses"],
    queryFn: () => listTicketStatuses(),
    staleTime: 1000 * 60 * 60,
  });

  const STATUSES = (statusesQ.data ?? []) as string[];


  const q = useQuery({
    queryKey: ["ticket", id],
    queryFn: () => getTicket(String(id)),
    enabled: !!id,
  });

  const t = q.data as any;


  const deptsQ = useQuery({
  queryKey: ["meta-hospital-departments"],
  queryFn: () => listHospitalDepartments(),
  staleTime: 1000 * 60 * 60,
});

const departments = (deptsQ.data ?? []) as { id: string; name: string }[];

const departmentName = (() => {
  const depId = t?.hospitaldepartmentid;
  if (depId == null) return "—";

  const depIdStr = String(depId).trim();
  const match = departments.find(d => String(d.id).trim() === depIdStr);
  return match?.name ?? `מחלקה לא נמצאה (ID: ${depIdStr})`;
})();

  const canDelete = hasAnyPermission(me, ["TICKET_DELETE"]);
  const canDup = hasAnyPermission(me, ["TICKET_DUPLICATE"]);
  const canReassign = hasAnyPermission(me, ["TICKET_REASSIGN"]);
  const canChangeStatus = !!me && me.role !== "CUSTOMER";

  const assigneesQ = useQuery({
    queryKey: ["assignees-lite"],
    queryFn: () => listAssignees(),
    enabled: !!id && canReassign,
  });

  const assignees = (assigneesQ.data ?? []) as AssigneeLite[];

  const [resolutionSummary, setResolutionSummary] = useState("");
  const [resolutionDetails, setResolutionDetails] = useState("");

  const [notes, setNotes] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string>("");

  useEffect(() => {
    if (!t) return;
    setResolutionSummary(t.resolutionSummary ?? "");
    setResolutionDetails(t.resolutionDetails ?? "");
    setNotes(t.notes ?? "");
    setSelectedStatus(t.status ?? "");
    setSelectedAssigneeId(t.assigneeId ?? "");
  }, [t]);

  const currentAssigneeLabel = useMemo(() => {
    if (!t?.assignee?.name) return "Unassigned";
    return t.assignee.name;
  }, [t]);

  const onSaveResolution = async () => {
    try {
      await updateTicket(String(id), { resolutionSummary, resolutionDetails });
      toast({ title: "Saved" });
      q.refetch();
    } catch (e: any) {
      toast({
        title: "Failed",
        description: e?.response?.data?.message ?? e?.message,
        variant: "destructive",
      });
    }
  };

  const onSaveNotes = async () => {
    try {
      await updateTicket(String(id), { notes });
      toast({ title: "Notes saved" });
      q.refetch();
    } catch (e: any) {
      toast({
        title: "Failed",
        description: e?.response?.data?.message ?? e?.message,
        variant: "destructive",
      });
    }
  };

  const onChangeStatus = async (next: string) => {
    try {
      setSelectedStatus(next);
      await updateTicket(String(id), { status: next });
      toast({ title: "Status updated" });
      q.refetch();
    } catch (e: any) {
      toast({
        title: "Failed",
        description: e?.response?.data?.message ?? e?.message,
        variant: "destructive",
      });
      setSelectedStatus(t?.status ?? "");
    }
  };

  const onReassign = async (assigneeId: string | null) => {
    try {
      await reassignTicket(String(id), assigneeId ?? "");
      toast({ title: "Reassigned" });
      q.refetch();
    } catch (e: any) {
      toast({
        title: "Failed",
        description: e?.response?.data?.message ?? e?.message,
        variant: "destructive",
      });
      setSelectedAssigneeId(t?.assigneeId ?? "");
    }
  };

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

  const statusBadgeClass = statusTone(t.status);
  const priorityBadgeClass = priorityTone(t.priority);
  console.log("Rendering ticket detail for", t);
  return (
    <MainLayout>
      <div className="space-y-5">
        {/* Header */}
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-slate-50 to-white dark:from-slate-900/60 dark:to-slate-950 border-b">
            <div className="p-4 md:p-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="text-xl md:text-2xl font-bold">
                    Ticket #{t.number}
                  </div>
                  <Badge className={`border-0 ${statusBadgeClass}`}>
                    {t.status}
                  </Badge>
                  <Badge className={`border-0 ${priorityBadgeClass}`}>
                    {t.priority}
                  </Badge>
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

                <div className="mt-1 text-sm text-muted-foreground truncate">
                  {t.subject}
                </div>
              </div>

              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" onClick={() => nav("/tickets")} className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>

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
                    <Copy className="h-4 w-4" />
                    Duplicate
                  </Button>
                )}
                <button
                  onClick={() => {
                    if (!t) return;

                    printTicketLabel({
                      number: t.number,
                      department: t.departmentName,
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
                </button>


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
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left: Details + Reassign inside */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Details
              </CardTitle>
              <CardDescription>
                Status, assignment, requester and metadata
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Status + Assignee strip */}
              <div className="rounded-xl border bg-card p-3 space-y-3">
                <div className="grid grid-cols-1 gap-3">
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-muted-foreground">STATUS</div>
                    {canChangeStatus ? (
                      <Select
                        value={selectedStatus || t.status}
                        onValueChange={(v) => onChangeStatus(v as any)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          {statusesQ.isLoading && (
                            <SelectItem value="__loading__" disabled>
                              Loading...
                            </SelectItem>
                          )}

                          {!statusesQ.isLoading &&
                            STATUSES.map((s) => (
                              <SelectItem key={s} value={s}>
                                {s}
                              </SelectItem>
                            ))}
                        </SelectContent>

                      </Select>
                    ) : (
                      <div className="text-sm">{t.status}</div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs font-medium text-muted-foreground">ASSIGNEE</div>

                    {canReassign ? (
                      <Select
                        value={selectedAssigneeId ?? ""}
                        onValueChange={(v) => {
                          setSelectedAssigneeId(v);
                          onReassign(v === "__none__" ? null : v);
                        }}
                      >
                        <SelectTrigger className="w-full">
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
                        Changing assignee requires <b>TICKET_REASSIGN</b>.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Meta rows */}
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="min-w-0">
                    <div className="text-xs text-muted-foreground">HOSPITAL DEPARTMENT</div>
                    <div className="font-medium truncate">{t.department?.name ?? "—"}</div>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <UserRound className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="min-w-0">
                    <div className="text-xs text-muted-foreground">REQUESTER</div>
                    <div className="font-medium break-words">{formatRequester(t)}</div>

                    {t.source === "PUBLIC" && (
                      <div className="mt-1 space-y-1 text-xs text-muted-foreground">
                        {t.externalRequesterEmail && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-3.5 w-3.5" />
                            <span className="break-all">{t.externalRequesterEmail}</span>
                          </div>
                        )}
                        {t.externalRequesterPhone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-3.5 w-3.5" />
                            <span>{t.externalRequesterPhone}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <CalendarDays className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="min-w-0">
                    <div className="text-xs text-muted-foreground">CREATED</div>
                    <div className="font-medium">{new Date(t.createdAt).toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Updated: {new Date(t.updatedAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Right: Content + Resolution + Notes */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Ticket Content</CardTitle>
                <CardDescription>
                  The original description reported for this ticket
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-xl border bg-card p-4">
                  <div className="text-sm whitespace-pre-wrap leading-6">
                    {t.description ?? "—"}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resolution</CardTitle>
                <CardDescription>Summary + details (internal)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">
                      SUMMARY
                    </label>
                    <Input
                      value={resolutionSummary}
                      onChange={(e) => setResolutionSummary(e.target.value)}
                      placeholder="Short outcome..."
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">
                      QUICK ACTION
                    </label>
                    <div className="flex gap-2">
                      <Button className="w-full" onClick={onSaveResolution}>
                        Save
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          setResolutionSummary(t.resolutionSummary ?? "");
                          setResolutionDetails(t.resolutionDetails ?? "");
                        }}
                      >
                        Reset
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    DETAILS
                  </label>
                  <Textarea
                    value={resolutionDetails}
                    onChange={(e) => setResolutionDetails(e.target.value)}
                    rows={7}
                    placeholder="What was done, steps taken, final fix, etc..."
                  />
                </div>
              </CardContent>
            </Card>

            {me?.role !== "CUSTOMER" && (
              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                  <CardDescription>
                    Internal notes — not visible to customers
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={7}
                    placeholder="Internal notes..."
                  />
                  <div className="flex gap-2">
                    <Button onClick={onSaveNotes}>Save Notes</Button>
                    <Button
                      variant="outline"
                      onClick={() => setNotes(t.notes ?? "")}
                    >
                      Reset
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
