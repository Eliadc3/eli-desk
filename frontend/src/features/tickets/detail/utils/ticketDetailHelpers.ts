export type TicketStatusDto = {
  id: string;
  key: string;
  labelHe: string;
  color?: string | null;
  sortOrder: number;
  isDefault: boolean;
};

export function priorityTone(priority: string) {
  switch ((priority ?? "").toUpperCase()) {
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

export function statusLabelFromAny(status: any): string {
  if (!status) return "—";
  if (typeof status === "string") return status;
  return status.labelHe ?? status.key ?? status.id ?? "—";
}

export function statusKeyFromAny(status: any): string {
  if (!status) return "";
  if (typeof status === "string") return status.toUpperCase();
  return String(status.key ?? "").toUpperCase();
}

export function formatRequester(ticket: any) {
  if (!ticket) return "—";
  if (ticket.source === "PUBLIC") {
    const name = ticket.externalRequesterName || "Public";
    const phone = ticket.externalRequesterPhone ? ` • ${ticket.externalRequesterPhone}` : "";
    return `${name}${phone}`;
  }
  return ticket.requester?.name || "—";
}

export function makeDraftFromTicket(ticket: any) {
  return {
    subject: ticket.subject ?? "",
    description: ticket.description ?? "",
    statusId: ticket.statusId ?? ticket.status?.id ?? "",
    priority: ticket.priority ?? "",
    assigneeId: ticket.assigneeId ?? "",
    hospitalDepartmentId: ticket.hospitalDepartmentId ?? "",
    externalRequesterName: ticket.externalRequesterName ?? "",
    externalRequesterPhone: ticket.externalRequesterPhone ?? "",
    notes: ticket.notes ?? "",
    resolutionSummary: ticket.resolutionSummary ?? "",
    resolutionDetails: ticket.resolutionDetails ?? "",
  };
}

export function computeHeaderStatusLabel(draft: any, statuses: TicketStatusDto[], ticket: any): string {
  const draftId = draft?.statusId;
  if (draftId) {
    const match = statuses.find((item) => item.id === draftId);
    if (match) return match.labelHe ?? match.key;
  }
  return statusLabelFromAny(ticket?.status);
}

export function computeCurrentStatusKey(draft: any, statuses: TicketStatusDto[], ticket: any): string {
  const draftId = draft?.statusId;
  if (draftId) {
    const match = statuses.find((item) => item.id === draftId);
    if (match?.key) return match.key.toUpperCase();
  }
  return statusKeyFromAny(ticket?.status);
}

export function computeStatusColor(draft: any, statuses: TicketStatusDto[], ticket: any): string | null {
  const draftId = draft?.statusId;
  if (draftId) {
    const match = statuses.find((item) => item.id === draftId);
    if (match?.color) return match.color;
  }
  if (ticket?.status?.color) return ticket.status.color;
  return null;
}

export function isClosingStatus(statusKey: string) {
  return ["RESOLVED", "CLOSED"].includes((statusKey ?? "").toUpperCase());
}

export function validateBeforeSave(draft: any, currentStatusKey: string) {
  if (!isClosingStatus(currentStatusKey)) return null;
  const summary = (draft?.resolutionSummary ?? "").trim();
  if (summary.length < 4) {
    return "כדי לסגור/לפתור קריאה, חייב למלא 'סיכום פתרון' (לפחות 4 תווים).";
  }
  return null;
}
