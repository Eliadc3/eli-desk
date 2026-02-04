import { api } from "./client";
import type { Permission } from "./auth";
import axios from "axios";
import { translateBackendError } from "../utils/backendErrorTranslator";

export type DepartmentType = "TECH" | "HOSPITAL";
export type Department = { id: string; name: string; type: DepartmentType };

export async function listDepartments() {
  const { data } = await api.get("/admin/departments");
  return data.items as Department[];
}

export async function createDepartment(payload: { name: string; type: DepartmentType }) {
  const { data } = await api.post("/admin/departments", payload);
  return data as Department;
}

export async function patchDepartment(id: string, payload: { name?: string }) {
  const { data } = await api.patch(`/admin/departments/${id}`, payload);
  return data as Department;
}

export async function deleteDepartment(id: string) {
  const { data } = await api.delete(`/admin/departments/${id}`);
  return data as { ok: boolean };
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

export async function listTechnicians() {
  const { data } = await api.get("/admin/technicians");
  return data.items as Technician[];
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
  payload: { name?: string; password?: string; techDepartmentId?: string | null; permissions?: Permission[] }
) {
  const { data } = await api.patch(`/admin/technicians/${id}`, payload);
  return data;
}

export async function deleteTechnician(id: string) {
  try {
    const { data } = await api.delete(`/admin/technicians/${id}`);
    return data as { ok: boolean };
  } catch (err: any) {
    if (axios.isAxiosError(err)) {
      const backendMessage =
        err.response?.data?.error || "פעולה נכשלה";

      throw new Error(translateBackendError(backendMessage));
    }

    throw err;
  }
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

