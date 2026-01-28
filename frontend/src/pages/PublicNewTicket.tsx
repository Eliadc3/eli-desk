import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useState } from "react";
import { createPublicTicket } from "@/api/tickets";
import { listHospitalDepartmentsPublic } from "@/api/departments";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export default function PublicNewTicket() {
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [hospitalDepartmentId, setHospitalDepartmentId] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();
  const nav = useNavigate();

  useEffect(() => {
    (async () => {
      const d = await listHospitalDepartmentsPublic();
      setDepartments(d.map((x) => ({ id: x.id, name: x.name })));
      if (d.length) setHospitalDepartmentId(d[0].id);
    })();
  }, []);

  const submit = async () => {
    if (!hospitalDepartmentId || !subject.trim() || !description.trim()) {
      toast({
        title: "Missing fields",
        description: "Department, subject and description are required",
        variant: "destructive",
      });
      return;
    }

    setBusy(true);
    try {
      const t = await createPublicTicket({
        hospitalDepartmentId,
        subject,
        description,
        name: name || undefined,
        phone: phone || undefined,
      });

      toast({ title: "Ticket submitted" });

      // ✅ הדרישה שלך: מעבר ל-ticketcreated
      nav("/ticketcreated", { state: { ticketNumber: t.number ?? "—" } });
    } catch (e: any) {
      toast({
        title: "Submit failed",
        description: e?.response?.data?.message ?? e?.message ?? "Unknown error",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4" dir="rtl">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle>פתיחת קריאה</CardTitle>
          <CardDescription>ללא התחברות</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm">מחלקה *</label>
            <select
              className="w-full border rounded-md p-2 bg-background"
              value={hospitalDepartmentId}
              onChange={(e) => setHospitalDepartmentId(e.target.value)}
            >
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm">שם</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm">טלפון *</label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm">נושא *</label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>

          <div className="space-y-2">
            <label className="text-sm">תיאור *</label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={6} />
          </div>

          <Button onClick={submit} disabled={busy} className="w-full">
            {busy ? "שולח..." : "שלח קריאה"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
