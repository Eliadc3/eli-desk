import { api } from "./client";
import type { Permission } from "./auth";

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

export type Technician = {
  id: string;
  email: string;
  name: string;
  role: string;
  techDepartmentId: string | null;
  permissions: { perm: Permission }[];
};

export async function listTechnicians() {
  const { data } = await api.get("/admin/technicians");
  return data.items as Technician[];
}

export async function createTechnician(payload: {
  email: string;
  name: string;
  password: string;
  techDepartmentId?: string | null;
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
  const { data } = await api.delete(`/admin/technicians/${id}`);
  return data as { ok: boolean };
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
