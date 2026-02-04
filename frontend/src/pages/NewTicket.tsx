import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useMemo, useState } from "react";
import { createTicket, getNextTicketNumber } from "@/api/tickets";
import { listHospitalDepartments } from "@/api/departments";
import { listTicketPriorities, listTicketStatuses } from "@/api/meta";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

type DeptLite = { id: string; name: string };

type StatusDto = {
  id: string;
  key: string;
  labelHe: string;
  color?: string | null;
  sortOrder: number;
  isDefault: boolean;
};

export default function NewTicket() {
  const nav = useNavigate();
  const { toast } = useToast();

  const [previewNumber, setPreviewNumber] = useState<number | null>(null);
  const [departments, setDepartments] = useState<DeptLite[]>([]);
  const [statuses, setStatuses] = useState<StatusDto[]>([]);
  const [priorities, setPriorities] = useState<string[]>([]);

  // Working copy (NOT persisted until Save)
  const [draft, setDraft] = useState({
    externalRequesterName: "",
    externalRequesterPhone: "",
    hospitalDepartmentId: "",
    subject: "",
    description: "",
    statusId: "",
    priority: "MEDIUM",
  });

  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [num, depts, st, pr] = await Promise.all([
          getNextTicketNumber(),
          listHospitalDepartments(),
          listTicketStatuses(),
          listTicketPriorities(),
        ]);

        setPreviewNumber(num);
        setDepartments(depts.map((x) => ({ id: x.id, name: x.name })));
        setStatuses(st);
        setPriorities(pr);

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
          description: e?.response?.data?.message ?? e?.message ?? "Unknown error",
          variant: "destructive",
        });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const deptName = useMemo(() => {
    return departments.find((d) => d.id === draft.hospitalDepartmentId)?.name ?? "";
  }, [departments, draft.hospitalDepartmentId]);

  const onCancel = () => {
    nav("/tickets");
  };

  const onSave = async () => {
    if (!draft.hospitalDepartmentId || !draft.subject.trim() || !draft.description.trim()) {
      toast({
        title: "חסרים שדות חובה",
        description: "מחלקה, נושא ותיאור הם חובה.",
        variant: "destructive",
      });
      return;
    }

    if (!draft.statusId) {
      toast({
        title: "חסר סטטוס",
        description: "בחר סטטוס תקין.",
        variant: "destructive",
      });
      return;
    }

    setBusy(true);
    try {
      const created = await createTicket({
        hospitalDepartmentId: draft.hospitalDepartmentId,
        subject: draft.subject,
        description: draft.description,
        statusId: draft.statusId || undefined,
        priority: draft.priority as any,
        externalRequesterName: draft.externalRequesterName.trim() || undefined,
        externalRequesterPhone: draft.externalRequesterPhone.trim() || undefined,
      });

      toast({ title: "נשמר" });
      nav(`/tickets/${created.id}`);
    } catch (e: any) {
      toast({
        title: "שמירה נכשלה",
        description: e?.response?.data?.message ?? e?.message ?? "Unknown error",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

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

          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm">שם</label>
                <Input
                  value={draft.externalRequesterName}
                  onChange={(e) => setDraft((d) => ({ ...d, externalRequesterName: e.target.value }))}
                  placeholder="שם"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm">טלפון</label>
                <Input
                  value={draft.externalRequesterPhone}
                  onChange={(e) => setDraft((d) => ({ ...d, externalRequesterPhone: e.target.value }))}
                  placeholder="טלפון"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm">מחלקה מדווחת *</label>
                <select
                  className="w-full border rounded-md p-2 bg-background"
                  value={draft.hospitalDepartmentId}
                  onChange={(e) => setDraft((d) => ({ ...d, hospitalDepartmentId: e.target.value }))}
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-col gap-3">
                <div className="space-y-2">
                  <label className="text-sm">סטטוס</label>
                  <select
                    className="w-full border rounded-md p-2 bg-background"
                    value={draft.statusId}
                    onChange={(e) => setDraft((d) => ({ ...d, statusId: e.target.value }))}
                  >
                    {statuses.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.labelHe}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm">נושא *</label>
              <Input
                value={draft.subject}
                onChange={(e) => setDraft((d) => ({ ...d, subject: e.target.value }))}
                placeholder="כותרת קצרה"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm">תיאור *</label>
              <Textarea
                value={draft.description}
                onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                placeholder="תאר את התקלה"
                rows={7}
              />
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button onClick={onSave} disabled={busy}>
                {busy ? "שומר..." : "Save"}
              </Button>
              <Button variant="outline" onClick={onCancel} disabled={busy}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
