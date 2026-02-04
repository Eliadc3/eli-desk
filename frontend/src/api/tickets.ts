import { api } from "./client";

export type TicketStatus = "NEW" | "IN_PROGRESS" | "WAITING" | "RESOLVED" | "CLOSED";
export type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type TicketSource = "TECHNICIAN" | "PORTAL" | "PUBLIC";

export type UserLite = { id: string; name: string; };
export type DepartmentLite = { id: string; name: string; type: "HOSPITAL" | "TECH" };

export type Ticket = {
  id: string;
  number: number;
  subject: string;
  description: string;
  statusId: TicketStatus;
  priority: TicketPriority;
  source: TicketSource;
  createdAt: string;
  updatedAt: string;
  requester?: UserLite | null;
  assignee?: UserLite | null;
  hospitalDepartment?: DepartmentLite | null;
  externalRequesterName?: string | null;
  externalRequesterPhone?: string | null;
  resolutionSummary?: string | null;
  resolutionDetails?: string | null;
};

export type TicketActivity = {
  id: string;
  type: string;
  message: string;
  createdAt: string;
  actor?: UserLite | null;
  metaJson?: string | null;
};

export async function listTickets(params?: { status?: string }) {
  const { data } = await api.get("/tickets", { params });
  return data.items as Ticket[];
}

export async function getTicket(id: string) {
  const { data } = await api.get(`/tickets/${id}`);
  return data as Ticket & { activities: TicketActivity[] };
}

export async function createTicket(payload: {
  hospitalDepartmentId: string;
  subject: string;
  description: string;
  priority?: TicketPriority;
  requesterId?: string;
  assigneeId?: string;
  statusId?: string; // ✅ ID של הסטטוס מהטבלה
  externalRequesterName?: string;
  externalRequesterPhone?: string;
}) {
  const { data } = await api.post("/tickets", payload);
  return data;
}


export async function updateTicket(id: string, payload: any) {
  const res = await api.patch(`/tickets/${id}`, payload);
  return res.data;
}


export async function getNextTicketNumber() {
  const { data } = await api.get("/meta/ticket-next-number");
  return data.number as number;
}

export async function createPublicTicket(payload: {
  hospitalDepartmentId: string;
  subject: string;
  description: string;
  priority?: TicketPriority;
  name?: string;
  phone?: string;
  orgId?: string;
}) {
  const { data } = await api.post("/public/tickets", payload);
  return data.ticket ?? data;
}
