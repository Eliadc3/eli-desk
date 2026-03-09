import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getTicket, updateTicket } from "@/api/tickets";
import { duplicateTicket, deleteTicket, listAssignees, type AssigneeLite } from "@/api/admin";
import { listTicketStatuses } from "@/api/meta";
import { listHospitalDepartments } from "@/api/departments";
import { hasAnyPermission, useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { printTicketLabel } from "@/lib/printTicketLabel";
import { translateBackendError } from "@/utils/backendErrorTranslator";
import {
  TicketStatusDto,
  computeCurrentStatusKey,
  computeHeaderStatusLabel,
  computeStatusColor,
  makeDraftFromTicket,
  validateBeforeSave,
} from "../utils/ticketDetailHelpers";

export function useTicketDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { me } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const statusesQ = useQuery({ queryKey: ["meta-ticket-statuses"], queryFn: () => listTicketStatuses(), staleTime: 1000 * 60 * 60 });
  const departmentsQ = useQuery({ queryKey: ["meta-hospital-departments"], queryFn: listHospitalDepartments, staleTime: 1000 * 60 * 60 });
  const ticketQ = useQuery({ queryKey: ["ticket", id], queryFn: () => getTicket(String(id)), enabled: !!id });

  const ticket = ticketQ.data as any;
  const [draft, setDraft] = useState<any>(null);

  useEffect(() => {
    if (!ticket) return;
    setDraft(makeDraftFromTicket(ticket));
  }, [ticket]);

  const canDelete = hasAnyPermission(me, ["TICKET_DELETE"]);
  const canDuplicate = hasAnyPermission(me, ["TICKET_DUPLICATE"]);
  const canReassign = hasAnyPermission(me, ["TICKET_REASSIGN"]);
  const canEdit = !!me && me.role !== "CUSTOMER";

  const assigneesQ = useQuery({ queryKey: ["assignees-lite"], queryFn: () => listAssignees(), enabled: !!id && canReassign });

  const statuses = (statusesQ.data ?? []) as TicketStatusDto[];
  const assignees = (assigneesQ.data ?? []) as AssigneeLite[];
  const currentAssigneeLabel = useMemo(() => ticket?.assignee?.name || "Unassigned", [ticket]);
  const departmentName = (departmentsQ.data ?? []).find((department: any) => department.id === ticket?.hospitalDepartmentId)?.name ?? "—";

  const saveMutation = useMutation({
    mutationFn: (payload: any) => updateTicket(String(id), payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["ticket", id] });
      await ticketQ.refetch();
      toast({ title: "Saved" });
    },
    onError: (error: any) => {
      const status = error?.response?.status;
      const data = error?.response?.data;
      let rawMessage: string | null = null;
      if (data && typeof data === "object") {
        if (typeof data.error === "string") rawMessage = data.error;
        else if (typeof data.message === "string") rawMessage = data.message;
        else if (Array.isArray((data as any).issues)) rawMessage = (data as any).issues.map((item: any) => `${item.path}: ${item.message}`).join("\n");
      }
      if (!rawMessage && typeof data === "string") rawMessage = data;
      if (!rawMessage) rawMessage = error?.message ?? "שגיאה לא ידועה";
      toast({ title: `שמירה נכשלה${status ? ` (${status})` : ""}`, description: translateBackendError(rawMessage), variant: "destructive" });
    },
  });

  const currentStatusKey = computeCurrentStatusKey(draft, statuses, ticket);
  const headerStatusLabel = computeHeaderStatusLabel(draft, statuses, ticket);
  const headerStatusColor = computeStatusColor(draft, statuses, ticket);

  const saveDraft = () => {
    if (!draft) return;
    const validationError = validateBeforeSave(draft, currentStatusKey);
    if (validationError) {
      toast({ title: "Cannot save", description: validationError, variant: "destructive" });
      return;
    }
    saveMutation.mutate({
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
  };

  const resetDraft = () => { if (ticket) setDraft(makeDraftFromTicket(ticket)); };
  const duplicateCurrentTicket = async () => {
    try {
      const copy = await duplicateTicket(String(id));
      toast({ title: "Duplicated" });
      nav(`/tickets/${copy.id}`);
    } catch (error: any) {
      toast({ title: "Failed", description: error?.response?.data?.message ?? error?.message, variant: "destructive" });
    }
  };
  const printLabel = () => {
    if (!ticket) return;
    printTicketLabel({ number: ticket.number, department: ticket.hospitalDepartment?.name, requester: ticket.externalRequesterName, assignee: ticket.assignee?.name, createdAt: ticket.createdAt, subject: ticket.subject, description: ticket.description });
  };
  const deleteCurrentTicket = async () => {
    if (!confirm("Delete ticket?")) return;
    try {
      await deleteTicket(String(id));
      toast({ title: "Deleted" });
      nav("/tickets");
    } catch (error: any) {
      toast({ title: "Failed", description: error?.response?.data?.message ?? error?.message, variant: "destructive" });
    }
  };

  return { id, nav, me, ticketQ, ticket, draft, setDraft, statusesQ, statuses, departmentsQ, assignees, currentAssigneeLabel, departmentName, canDelete, canDuplicate, canReassign, canEdit, saveMutation, currentStatusKey, headerStatusLabel, headerStatusColor, saveDraft, resetDraft, duplicateCurrentTicket, printLabel, deleteCurrentTicket };
}
