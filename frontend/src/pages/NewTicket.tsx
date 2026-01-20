import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useState } from "react";
import { createTicket } from "@/api/tickets";
import { listHospitalDepartments } from "@/api/departments";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export default function NewTicket() {
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [hospitalDepartmentId, setHospitalDepartmentId] = useState("");
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();
  const nav = useNavigate();

  useEffect(() => {
    (async () => {
      const d = await listHospitalDepartments();
      setDepartments(d.map((x) => ({ id: x.id, name: x.name })));
      if (d.length) setHospitalDepartmentId(d[0].id);
    })();
  }, []);

  const onSubmit = async () => {
    if (!subject.trim() || !description.trim() || !hospitalDepartmentId) {
      toast({ title: "Missing fields", description: "Department, subject and description are required", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      const created = await createTicket({ hospitalDepartmentId, subject, description });
      toast({ title: "Ticket created" });
      nav(`/tickets/${created.ticket?.id ?? created.id ?? ""}`);
    } catch (e: any) {
      toast({ title: "Create failed", description: e?.response?.data?.message ?? e?.message ?? "Unknown error", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Create Ticket</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm">Hospital Department *</label>
              <select className="w-full border rounded-md p-2 bg-background" value={hospitalDepartmentId} onChange={(e) => setHospitalDepartmentId(e.target.value)}>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm">Subject *</label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Short title" />
            </div>

            <div className="space-y-2">
              <label className="text-sm">Description *</label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the issue" rows={6} />
            </div>

            <Button onClick={onSubmit} disabled={busy}>
              {busy ? "Creating..." : "Create"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
