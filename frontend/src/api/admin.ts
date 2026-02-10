import { api } from "./client";
import type { Permission } from "./auth";

export type DepartmentType = "TECH" | "HOSPITAL";
export type Department = { id: string; name: string; type: DepartmentType };

export async function listDepartments(params?: { active?: boolean }) {
  const active = params?.active ?? true;
  const res = await api.get("/admin/departments", { params: { active } });
  return res.data.items;
}
export async function createDepartment(payload: { name: string; type: DepartmentType }) {
  const { data } = await api.post("/admin/departments", payload);
  return data as Department;
}

export async function patchDepartment(id: string, payload: { name?: string; isActive?: boolean }) {
  const { data } = await api.patch(`/admin/departments/${id}`, payload);
  return data as Department;
}

export async function disableDepartment(id: string) {
  const res = await api.delete(`/admin/departments/${id}`);
  return res.data;
}

export async function enableDepartment(id: string) {
  const res = await api.patch(`/admin/departments/${id}`, { isActive: true });
  return res.data;
}


export type TicketStatusAdminDto = {
  id: string;
  key: string;
  labelHe: string;
  color?: string | null;
  sortOrder: number;
  isActive: boolean;
  isDefault: boolean;
};

export async function listAdminTicketStatuses() {
  const { data } = await api.get("/admin/ticket-statuses");
  return data.items as TicketStatusAdminDto[];
}

export async function createAdminTicketStatus(payload: {
  key: string;
  labelHe: string;
  color?: string | null;
  sortOrder?: number;
  isActive?: boolean;
  isDefault?: boolean;
}) {
  const { data } = await api.post("/admin/ticket-statuses", payload);
  return data as TicketStatusAdminDto;
}

export async function patchAdminTicketStatus(
  id: string,
  payload: Partial<{
    key: string;
    labelHe: string;
    color: string | null;
    sortOrder: number;
    isActive: boolean;
    isDefault: boolean;
  }>
) {
  const { data } = await api.patch(`/admin/ticket-statuses/${id}`, payload);
  return data as TicketStatusAdminDto;
}

export async function deleteAdminTicketStatus(id: string) {
  const { data } = await api.delete(`/admin/ticket-statuses/${id}`);
  return data as { ok: boolean };
}



export type Technician = {
  id: string;
  username: string;
  name: string;
  role: string;
  techDepartmentId: string ;
  permissions: { perm: Permission }[];
};

// ✅ Technicians
export async function listTechnicians(params?: { active?: boolean }) {
  const active = params?.active ?? true;
  const res = await api.get("/admin/technicians", { params: { active } });
  return res.data.items;
}

export async function createTechnician(payload: {
  name: string;
  username: string;
  password: string;
  techDepartmentId: string ;
  permissions?: Permission[];
}) {
  const { data } = await api.post("/admin/technicians", payload);
  return data;
}

export async function patchTechnician(
  id: string,
  payload: { name?: string; password?: string; techDepartmentId?: string | null; permissions?: Permission[]; isActive?: boolean }
) {
  const { data } = await api.patch(`/admin/technicians/${id}`, payload);
  return data;
}

export async function disableTechnician(id: string) {
  const res = await api.delete(`/admin/technicians/${id}`);
  return res.data;
}

export async function enableTechnician(id: string) {
  return api.patch(`/admin/technicians/${id}`, { isActive: true });
}

export async function reassignTicket(id: string, assigneeId: string) {
  const { data } = await api.post(`/admin/tickets/${id}/reassign`, { assigneeId });
  return data;
}

export async function duplicateTicket(id: string) {
  const { data } = await api.post(`/admin/tickets/${id}/duplicate`);
  return data;
}

export async function deleteTicket(id: string) {
  const { data } = await api.delete(`/admin/tickets/${id}`);
  return data as { ok: boolean };
}

export type AssigneeLite = {
  id: string;
  name: string;
};

export async function listAssignees() {
  const { data } = await api.get("/admin/assignees");
  return data.items as AssigneeLite[];
}

