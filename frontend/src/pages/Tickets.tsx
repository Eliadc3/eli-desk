import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/MainLayout";
import { TicketBulkActions } from "@/components/tickets/TicketBulkActions";
import { TicketFilters } from "@/components/tickets/TicketFilters";
import { TicketsTable, TicketRow } from "@/components/tickets/TicketsTable";
import {
  bulkDeleteTickets,
  bulkUpdateTickets,
  listTicketAssignees,
  listTickets,
  TicketPriority,
} from "@/api/tickets";
import { listTicketStatuses } from "@/api/meta";
import { useAuth, hasAnyPermission } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { translateBackendError } from "@/utils/backendErrorTranslator";

function toRow(t: any): TicketRow {
  const requesterName = t.source === "PUBLIC" ? t.externalRequesterName || "Public" : t.requester?.name || "—";

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

  const statusKeyRaw = typeof t.status === "string" ? t.status : t.status?.key ?? t.status?.name ?? t.status?.id ?? "";
  const priority = String(t.priority || "").toLowerCase();

  return {
    id: t.id,
    number: t.number,
    displayId: `#${t.number}`,
    subject: t.subject ?? "",
    requester: { name: requesterName, initials: requesterInitials },
    department: t.hospitalDepartment?.name ?? "—",
    status: statusKeyRaw,
    statusId: t.status?.id ?? t.statusId ?? "",
    statusKey: t.status?.key ?? statusKeyRaw ?? "",
    statusLabel: t.status?.labelHe ?? "",
    statusColor: t.status?.color ?? "",
    priority: priority as any,
    assignee: t.assignee
      ? {
          id: t.assignee.id,
          name: assigneeName,
          initials: assigneeInitials,
        }
      : undefined,
    assigneeId: t.assignee?.id ?? null,
    createdAt: new Date(t.createdAt).toLocaleString(),
    isOverdue: false,
  };
}

export default function Tickets() {
  const { me } = useAuth();
  const { toast } = useToast();

  const [status, setStatus] = useState<string>("ALL");
  const [priority, setPriority] = useState<string>("all");
  const [search, setSearch] = useState<string>("");
  const [assigneeFilter, setAssigneeFilter] = useState<"all" | "me" | "unassigned">("all");
  const [selectedTicketIds, setSelectedTicketIds] = useState<string[]>([]);
  const [bulkStatusId, setBulkStatusId] = useState("");
  const [bulkAssigneeId, setBulkAssigneeId] = useState("");
  const [bulkPriority, setBulkPriority] = useState<"" | TicketPriority>("");
  const [bulkLoading, setBulkLoading] = useState(false);

  const ticketsQuery = useQuery({
    queryKey: ["tickets", status],
    queryFn: async () => {
      const filters: any = {};
      if (status !== "ALL") filters.status = status;
      return listTickets(Object.keys(filters).length ? filters : undefined);
    },
  });

  const statusesQuery = useQuery({
    queryKey: ["ticket-statuses"],
    queryFn: listTicketStatuses,
  });

  const assigneesQuery = useQuery({
    queryKey: ["ticket-assignees"],
    queryFn: listTicketAssignees,
  });

  const canBulkChangeStatus = Boolean(me && me.role !== "CUSTOMER");
  const canBulkAssign = hasAnyPermission(me, ["TICKET_REASSIGN"]);
  const canBulkChangePriority = Boolean(me && me.role !== "CUSTOMER");
  const canBulkDelete = hasAnyPermission(me, ["TICKET_DELETE"]);

  const rows = useMemo(() => (ticketsQuery.data ?? []).map(toRow), [ticketsQuery.data]);

  const filteredRows = useMemo(() => {
    let out = rows;

    if (assigneeFilter === "unassigned") {
      out = out.filter((t: any) => !t.assignee && !t.assigneeId);
    }

    if (assigneeFilter === "me") {
      if (!me) return out;

      const myId = (me as any).id;
      const myName = String((me as any).name ?? "").toLowerCase();

      out = out.filter((t: any) => {
        if (t.assigneeId && myId) return String(t.assigneeId) === String(myId);
        if (t.assignee?.id && myId) return String(t.assignee.id) === String(myId);

        const assigneeName = String(t.assignee?.name ?? "").toLowerCase();
        if (myName && assigneeName) return assigneeName === myName;

        return false;
      });
    }

    if (priority !== "all") {
      out = out.filter((t: any) => String(t.priority || "").toLowerCase() === priority);
    }

    const normalizedSearch = search.trim().toLowerCase();
    if (normalizedSearch) {
      out = out.filter((t: any) => {
        const haystack = [
          `#${t.number ?? ""}`,
          t.subject ?? "",
          t.requester?.name ?? "",
          t.department ?? "",
          t.assignee?.name ?? "",
          t.statusLabel ?? "",
          t.statusKey ?? "",
        ]
          .join(" ")
          .toLowerCase();

        return haystack.includes(normalizedSearch);
      });
    }

    return out;
  }, [rows, assigneeFilter, priority, search, me]);

  function toggleTicketSelection(ticketId: string, checked: boolean) {
    setSelectedTicketIds((prev) => (checked ? [...new Set([...prev, ticketId])] : prev.filter((id) => id !== ticketId)));
  }

  function toggleSelectAllCurrentPage(checked: boolean, ticketIdsOnPage: string[]) {
    setSelectedTicketIds((prev) => {
      if (checked) {
        return [...new Set([...prev, ...ticketIdsOnPage])];
      }
      return prev.filter((id) => !ticketIdsOnPage.includes(id));
    });
  }

  function clearSelection() {
    setSelectedTicketIds([]);
  }

  async function handleBulkApply() {
    if (!selectedTicketIds.length) return;

    const payload: {
      ticketIds: string[];
      statusId?: string;
      assigneeId?: string | null;
      priority?: TicketPriority;
    } = {
      ticketIds: selectedTicketIds,
    };

    if (bulkStatusId && canBulkChangeStatus) payload.statusId = bulkStatusId;
    if (bulkPriority && canBulkChangePriority) payload.priority = bulkPriority;
    if (canBulkAssign && bulkAssigneeId) payload.assigneeId = bulkAssigneeId === "unassigned" ? null : bulkAssigneeId;

    try {
      setBulkLoading(true);
      await bulkUpdateTickets(payload);

      toast({
        title: "הקריאות עודכנו",
        description: `עודכנו ${selectedTicketIds.length} קריאות`,
      });

      setBulkStatusId("");
      setBulkAssigneeId("");
      setBulkPriority("");
      clearSelection();
      await ticketsQuery.refetch();
    } catch (err) {
      toast({
        title: "שגיאה בעדכון הקריאות",
        description: translateBackendError(err),
        variant: "destructive",
      });
    } finally {
      setBulkLoading(false);
    }
  }

  async function handleBulkDelete() {
    if (!selectedTicketIds.length || !canBulkDelete) return;

    const ok = window.confirm(`למחוק ${selectedTicketIds.length} קריאות מסומנות?`);
    if (!ok) return;

    try {
      setBulkLoading(true);
      await bulkDeleteTickets(selectedTicketIds);

      toast({
        title: "הקריאות נמחקו",
        description: `נמחקו ${selectedTicketIds.length} קריאות`,
      });

      clearSelection();
      await ticketsQuery.refetch();
    } catch (err) {
      toast({
        title: "שגיאה במחיקת הקריאות",
        description: translateBackendError(err),
        variant: "destructive",
      });
    } finally {
      setBulkLoading(false);
    }
  }

  const tableTickets = filteredRows.map((ticket: any) => ({
    id: ticket.id,
    number: ticket.number,
    displayId: ticket.displayId,
    subject: ticket.subject,
    requester: {
      name: ticket.requester?.name || "—",
      initials: ticket.requester?.initials || "?",
    },
    department: ticket.department ?? "—",
    status: ticket.status,
    statusId: ticket.statusId,
    statusKey: ticket.statusKey,
    statusLabel: ticket.statusLabel,
    statusColor: ticket.statusColor,
    priority: String(ticket.priority || "").toLowerCase(),
    assignee: ticket.assignee
      ? {
          id: ticket.assignee.id,
          name: ticket.assignee.name,
          initials: ticket.assignee.initials || "?",
        }
      : undefined,
    assigneeId: ticket.assigneeId,
    createdAt: ticket.createdAt,
  })) as any;

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">קריאות שירות</h1>
            <p className="text-muted-foreground">ניהול ומעקב אחר כל הקריאות במערכת</p>
          </div>
        </div>

        <TicketFilters
          onStatusChange={(value) => setStatus(value === "all" ? "ALL" : String(value).toUpperCase().replace(/-/g, "_"))}
          onPriorityChange={setPriority}
          onSearch={setSearch}
          onAssigneeChange={setAssigneeFilter}
        />

        <TicketBulkActions
          selectedCount={selectedTicketIds.length}
          canBulkChangeStatus={canBulkChangeStatus}
          canBulkAssign={canBulkAssign}
          canBulkChangePriority={canBulkChangePriority}
          canBulkDelete={canBulkDelete}
          bulkStatusId={bulkStatusId}
          bulkAssigneeId={bulkAssigneeId}
          bulkPriority={bulkPriority}
          bulkLoading={bulkLoading}
          statusOptions={statusesQuery.data ?? []}
          assigneeOptions={assigneesQuery.data ?? []}
          onBulkStatusChange={setBulkStatusId}
          onBulkAssigneeChange={setBulkAssigneeId}
          onBulkPriorityChange={setBulkPriority}
          onClearSelection={clearSelection}
          onApply={handleBulkApply}
          onDelete={handleBulkDelete}
        />

        <TicketsTable
          tickets={tableTickets}
          selectedTicketIds={selectedTicketIds}
          onToggleTicketSelection={toggleTicketSelection}
          onToggleSelectAllCurrentPage={toggleSelectAllCurrentPage}
        />
      </div>
    </MainLayout>
  );
}
