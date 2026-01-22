// src/pages/TicketDetail.tsx
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getTicket, updateTicket } from "@/api/tickets";
import { duplicateTicket, deleteTicket, reassignTicket } from "@/api/admin";
import { hasAnyPermission, useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

export default function TicketDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { me } = useAuth();
  const { toast } = useToast();

  const q = useQuery({
    queryKey: ["ticket", id],
    queryFn: () => getTicket(String(id)),
    enabled: !!id,
  });

  const t = q.data as any;

  const [resolutionSummary, setResolutionSummary] = useState("");
  const [resolutionDetails, setResolutionDetails] = useState("");

  useEffect(() => {
    if (!t) return;
    setResolutionSummary(t.resolutionSummary ?? "");
    setResolutionDetails(t.resolutionDetails ?? "");
  }, [t]);

  const canDelete = hasAnyPermission(me, ["TICKET_DELETE"]);
  const canDup = hasAnyPermission(me, ["TICKET_DUPLICATE"]);
  const canReassign = hasAnyPermission(me, ["TICKET_REASSIGN"]);

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

  return (
    <MainLayout>
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Ticket #{t.number}</h1>
            <div className="text-sm text-muted-foreground">{t.subject}</div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => nav("/tickets")}>
              Back
            </Button>
            

            {canDup && (
              <Button
                variant="outline"
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
                Duplicate
              </Button>
            )}

            {canDelete && (
              <Button
                variant="destructive"
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
                Delete
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <b>Status:</b> {t.status}
              </div>
              <div>
                <b>Priority:</b> {t.priority}
              </div>
              <div>
                <b>Source:</b> {t.source}
              </div>
              <div>
                <b>Hospital Dept:</b> {t.hospitalDepartment?.name ?? "—"}
              </div>
              <div>
                <b>Requester:</b>{" "}
                {t.source === "PUBLIC"
                  ? (t.externalRequesterName || t.externalRequesterEmail || "Public")
                  : (t.requester?.name || t.requester?.email || "—")}
              </div>
              <div>
                <b>Assignee:</b> {t.assignee?.name ?? "Unassigned"}
              </div>
              <div>
                <b>Created:</b> {new Date(t.createdAt).toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resolution</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <label className="text-sm">Summary</label>
                <Input
                  value={resolutionSummary}
                  onChange={(e) => setResolutionSummary(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm">Details</label>
                <Textarea
                  value={resolutionDetails}
                  onChange={(e) => setResolutionDetails(e.target.value)}
                  rows={6}
                />
              </div>

              <Button onClick={onSaveResolution}>Save</Button>
            </CardContent>
          </Card>
        </div>

        {canReassign && (
          <Card>
            <CardHeader>
              <CardTitle>Reassign</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col md:flex-row gap-2">
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    const pick = prompt("Paste technicianId to assign.");
                    if (!pick) return;

                    await reassignTicket(String(id), pick);
                    toast({ title: "Reassigned" });
                    q.refetch();
                  } catch (e: any) {
                    toast({
                      title: "Failed",
                      description: e?.response?.data?.message ?? e?.message,
                      variant: "destructive",
                    });
                  }
                }}
              >
                Reassign (simple)
              </Button>

              <div className="text-xs text-muted-foreground">
                Note: for demo, reassign uses prompt. Next step can be a dropdown.
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
