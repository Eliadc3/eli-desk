import { MainLayout } from "@/components/layout/MainLayout";
import { TicketsTable, TicketRow } from "@/components/tickets/TicketsTable";
import { TicketFilters } from "@/components/tickets/TicketFilters";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listTickets } from "@/api/tickets";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

function toRow(t: any): TicketRow {
  const requesterName =
    t.source === "PUBLIC"
      ? (t.externalRequesterName || "Public")
      : (t.requester?.name || "—");

  const requesterInitials = (requesterName || "—")
    .split(" ")
    .map((x: string) => x[0])
    .slice(0, 2)
    .join("");

  const assigneeName = t.assignee?.name || "Unassigned";
  const assigneeInitials = (assigneeName || "Unassigned")
    .split(" ")
    .map((x: string) => x[0])
    .slice(0, 2)
    .join("");

  const status = String(t.status || "").toLowerCase().split("_").join("-");
  const priority = String(t.priority || "").toLowerCase();

  return {
    id: t.id,                  // ID אמיתי לניווט
    displayId: `#${t.number}`,  // לתצוגה בלבד
    subject: t.subject ?? "",
    requester: { name: requesterName, initials: requesterInitials },
    organization: t.hospitalDepartment?.name ?? "—",
    status: status as any,
    priority: priority as any,
    assignee: t.assignee ? { name: assigneeName, initials: assigneeInitials } : undefined,
    createdAt: new Date(t.createdAt).toLocaleString(),
    isOverdue: false,
  };
}

export default function Tickets() {
  const nav = useNavigate();
  const { me } = useAuth();

  const [status, setStatus] = useState<string>("ALL");        // API filter
  const [priority, setPriority] = useState<string>("all");    // client filter
  const [search, setSearch] = useState<string>("");           // client filter
  const [assigneeFilter, setAssigneeFilter] = useState<"all" | "me" | "unassigned">("all");

  const q = useQuery({
    queryKey: ["tickets", status],
    queryFn: async () => {
      const filters: any = {};
      if (status !== "ALL") filters.status = status;
      return listTickets(Object.keys(filters).length ? filters : undefined);
    },
  });

  const rows = useMemo(() => (q.data ?? []).map(toRow), [q.data]);

  const filteredRows = useMemo(() => {
    let out = rows;

        // 1) assignee filter
    if (assigneeFilter === "unassigned") {
      out = out.filter((t: any) => !t.assignee && !t.assigneeId);
    }

    if (assigneeFilter === "me") {
      // אם אין משתמש מחובר, לא מסננים
      if (!me) return out;

      const myId = (me as any).id;
      const myEmail = String((me as any).email ?? "").toLowerCase();
      const myName = String((me as any).name ?? "").toLowerCase();

      out = out.filter((t: any) => {
        // עדיפות 1: id
        if (t.assigneeId && myId) return String(t.assigneeId) === String(myId);
        if (t.assignee?.id && myId) return String(t.assignee.id) === String(myId);

        // fallback זמני: email/name (רק כדי שזה יעבוד אם אין id)
        const aEmail = String(t.assignee?.email ?? "").toLowerCase();
        const aName = String(t.assignee?.name ?? "").toLowerCase();
        if (myEmail && aEmail) return aEmail === myEmail;
        if (myName && aName) return aName === myName;

        return false;
      });
    }

    // priority client-filter
    if (priority !== "all") {
      out = out.filter((t: any) => String(t.priority || "").toLowerCase() === priority);
    }

    // search client-filter (subject / displayId / requester)
     const s = search.trim().toLowerCase();
    if (s) {
      out = out.filter((t: any) => {
        const hay = [
          `#${t.number ?? ""}`,
          t.subject ?? "",
          t.requester?.name ?? "",
          t.externalRequesterName ?? "",
          t.hospitalDepartment?.name ?? "",
          t.assignee?.name ?? "",
          t.assignee?.email ?? "",
        ]
          .join(" ")
          .toLowerCase();

        return hay.includes(s);
      });
    }

    return out;
  }, [rows, assigneeFilter, priority, search, me]);


  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">קריאות שירות</h1>
            <p className="text-muted-foreground">ניהול ומעקב אחר כל הקריאות במערכת</p>
          </div>

          <div className="flex gap-2">
            <Button onClick={() => nav("/tickets/new")}>
              <Plus className="h-4 w-4 mr-2" />
              פתיחת קריאה
            </Button>
            <Button variant="outline" onClick={() => nav("/public/new")}>
              טופס חיצוני (דמו)
            </Button>
            <Button variant="outline" onClick={() => nav("/admin")}>
              Admin
            </Button>
          </div>
        </div>

        <TicketFilters
          onStatusChange={(s) =>
            setStatus(s === "all" ? "ALL" : String(s).toUpperCase().replace("-", "_"))
          }
          onPriorityChange={(p) => setPriority(p)}
          onSearch={(q) => setSearch(q)}
          onAssigneeChange={(v) => setAssigneeFilter(v)}
        />

        <TicketsTable tickets={filteredRows.map((t: any) => ({
          id: t.id,
          displayId: `${t.displayId}`,
          subject: t.subject,
          requester: { name: t.requester?.name || t.externalRequesterName || "—", initials: "?" },
          organization: t.hospitalDepartment?.name ?? "—",
          status: String(t.status || "").toLowerCase().split("_").join("-"),
          priority: String(t.priority || "").toLowerCase(),
          assignee: t.assignee ? { name: t.assignee.name, initials: "?" } : undefined,
          createdAt: new Date(t.createdAt).toLocaleString(),
        })) as any} />


      </div>
    </MainLayout>
  );
}
