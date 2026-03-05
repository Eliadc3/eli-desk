import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useMemo, useState } from "react";
import { createTicket, getNextTicketNumber, listTicketAssignees } from "@/api/tickets";
import { listHospitalDepartments } from "@/api/departments";
import { listTicketPriorities, listTicketStatuses } from "@/api/meta";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { translateBackendError } from "@/utils/backendErrorTranslator";

type DeptLite = { id: string; name: string };

type StatusDto = {
  id: string;
  key: string;
  labelHe: string;
  color?: string | null;
  sortOrder: number;
  isDefault: boolean;
};

type AssigneeLite = { id: string; name: string };

export default function NewTicket() {
  const nav = useNavigate();
  const { toast } = useToast();

  const [previewNumber, setPreviewNumber] = useState<number | null>(null);
  const [departments, setDepartments] = useState<DeptLite[]>([]);
  const [statuses, setStatuses] = useState<StatusDto[]>([]);
  const [priorities, setPriorities] = useState<string[]>([]);
  const [assignees, setAssignees] = useState<AssigneeLite[]>([]);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  // Working copy (NOT persisted until Save)
  const [draft, setDraft] = useState({
    externalRequesterName: "",
    externalRequesterPhone: "",
    hospitalDepartmentId: "",
    subject: "",
    description: "",
    statusId: "",
    priority: "MEDIUM",
    assigneeId: null as string | null,
  });

  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [num, depts, st, pr, asg] = await Promise.all([
          getNextTicketNumber(),
          listHospitalDepartments(),
          listTicketStatuses(),
          listTicketPriorities(),
          listTicketAssignees(), // ✅ המקור היחיד לרשימה
        ]);

        setPreviewNumber(num);
        setDepartments(depts.map((x) => ({ id: x.id, name: x.name })));
        setStatuses(st);
        setPriorities(pr);

        setAssignees((asg ?? []).slice().sort((a, b) => a.name.localeCompare(b.name, ["he", "en"])));

        setDraft((d) => {
          const normalizeKey = (k?: string | null) => (k ?? "").trim().toUpperCase();

          const defaultStatus =
            st.find((x) => x.isDefault) ??
            st.find((x) => normalizeKey(x.key) === "NEW") ??
            st[0];

          return {
            ...d,
            hospitalDepartmentId: d.hospitalDepartmentId || (depts[0]?.id ?? ""),
            statusId: d.statusId || (defaultStatus?.id ?? ""),
            priority: d.priority || (pr.includes("MEDIUM") ? "MEDIUM" : pr[0] ?? "MEDIUM"),
          };
        });
      } catch (e: any) {
        toast({
          title: "Failed to load",
          description: translateBackendError(e),
          variant: "destructive",
        });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const deptName = useMemo(() => {
    return departments.find((d) => d.id === draft.hospitalDepartmentId)?.name ?? "";
  }, [departments, draft.hospitalDepartmentId]);

  const validateDraft = () => {
    const fe: Record<string, string[]> = {};

    if (!draft.hospitalDepartmentId) fe.hospitalDepartmentId = ["מחלקה חובה"];
    if (draft.externalRequesterName.trim().length < 2) fe.externalRequesterName = ["שם חייב להיות לפחות 2 תווים"];
    if (draft.externalRequesterPhone.trim().length < 4) fe.externalRequesterPhone = ["טלפון חייב להיות לפחות 4 ספרות"];
    if (draft.subject.trim().length < 3) fe.subject = ["נושא חייב להיות לפחות 3 תווים"];
    if (draft.description.trim().length < 1) fe.description = ["תיאור חובה"];
    if (!draft.statusId) fe.statusId = ["סטטוס חובה"];

    return fe;
  };

  const onCancel = () => {
    nav("/tickets");
  };

  const onSave = async () => {
    const fe = validateDraft();
    if (Object.keys(fe).length) {
      setErrors(fe);
      toast({
        title: "חסרים/לא תקינים",
        description: "תקן את השדות המסומנים",
        variant: "destructive",
      });
      return;
    }

    setBusy(true);
    try {
      const created = await createTicket({
        hospitalDepartmentId: draft.hospitalDepartmentId,
        subject: draft.subject.trim(),
        description: draft.description.trim(),
        statusId: draft.statusId,
        priority: draft.priority as any,
        assigneeId: draft.assigneeId ?? undefined,
        externalRequesterName: draft.externalRequesterName.trim(),
        externalRequesterPhone: draft.externalRequesterPhone.trim(),
      });

      toast({ title: "נשמר" });
      nav(`/tickets/${created.id}`);
    } catch (e: any) {
      const data = e?.response?.data;
      const fieldErrors = data?.details?.fieldErrors as Record<string, string[]> | undefined;

      if (fieldErrors && typeof fieldErrors === "object") {
        setErrors(fieldErrors);
        toast({
          title: "נא לתקן את השדות המסומנים",
          description: "בדוק את ההערות מתחת לשדות",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "שמירה נכשלה",
        description: translateBackendError(e),
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };
  function clearFieldError(field: string) {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }


  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-2 flex-wrap">
              <div>פתיחת קריאה (טכנאי)</div>
              <div className="text-sm text-muted-foreground">
                מספר קריאה: <span className="font-bold">{previewNumber ?? "…"}</span>
              </div>
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4" dir="rtl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-2">
                <label className="text-sm">שם *</label>
                <Input
                  value={draft.externalRequesterName}
                  onChange={(e) => {
                    setDraft((d) => ({ ...d, externalRequesterName: e.target.value }));
                    clearFieldError("externalRequesterName");
                  }}
                  placeholder="שם"
                />

                {errors.externalRequesterName?.[0] && (
                  <div className="text-xs text-red-600 mt-1">
                    {translateBackendError(errors.externalRequesterName[0])}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm">טלפון *</label>
                <Input
                  value={draft.externalRequesterPhone}
                  onChange={(e) => {
                    setDraft((d) => ({ ...d, externalRequesterPhone: e.target.value }));
                    clearFieldError("externalRequesterPhone");
                  }}
                  placeholder="טלפון"
                />

                {errors.externalRequesterPhone?.[0] && (
                  <div className="text-xs text-red-600 mt-1">
                    {translateBackendError(errors.externalRequesterPhone[0])}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm">מחלקה מדווחת *</label>
                <select
                  className="w-full border rounded-md p-2 bg-background"
                  value={draft.hospitalDepartmentId}
                  onChange={(e) => {
                    setDraft((d) => ({ ...d, hospitalDepartmentId: e.target.value }));
                    clearFieldError("hospitalDepartmentId");
                  }}
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
                {errors.hospitalDepartmentId?.[0] && (
                  <div className="text-xs text-red-600 mt-1">
                    {translateBackendError(errors.hospitalDepartmentId[0])}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm">שיוך לטכנאי</label>
                <select
                  className="w-full border rounded-md p-2 bg-background"
                  value={draft.assigneeId ?? ""}
                  onChange={(e) => setDraft((d) => ({ ...d, assigneeId: e.target.value || null }))}
                >
                  <option value="">ללא שיוך</option>
                  {assignees.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm">סטטוס *</label>
                <select
                  className="w-full border rounded-md p-2 bg-background"
                  value={draft.statusId}
                  onChange={(e) => {
                    setDraft((d) => ({ ...d, statusId: e.target.value }));
                    clearFieldError("statusId");
                  }}
                >
                  {statuses.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.labelHe}
                    </option>
                  ))}
                </select>
                {errors.statusId?.[0] && (
                  <div className="text-xs text-red-600 mt-1">
                    {translateBackendError(errors.statusId[0])}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm">עדיפות</label>
                <select
                  className="w-full border rounded-md p-2 bg-background"
                  value={draft.priority}
                  onChange={(e) => setDraft((d) => ({ ...d, priority: e.target.value }))}
                >
                  {priorities.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm">נושא *</label>
              <Input
                value={draft.subject}
                onChange={(e) => {
                  setDraft((d) => ({ ...d, subject: e.target.value }));
                  clearFieldError("subject");
                }}
                placeholder="כותרת קצרה"
              />

              {errors.subject?.[0] && (
                <div className="text-xs text-red-600 mt-1">
                  {translateBackendError(errors.subject[0])}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm">תיאור *</label>
              <Textarea
                value={draft.description}
                onChange={(e) => {
                  setDraft((d) => ({ ...d, description: e.target.value }));
                  clearFieldError("description");
                }}
                placeholder="תאר את התקלה"
                rows={7}
              />

              {errors.description?.[0] && (
                <div className="text-xs text-red-600 mt-1">
                  {translateBackendError(errors.description[0])}
                </div>
              )}
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button onClick={onSave} disabled={busy}>
                {busy ? "שומר..." : "Save"}
              </Button>
              <Button variant="outline" onClick={onCancel} disabled={busy}>
                Cancel
              </Button>
            </div>

            <div className="text-xs text-muted-foreground">
              מחלקה: {deptName}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}