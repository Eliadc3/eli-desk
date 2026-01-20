import { api, setAuthToken } from "./client";

export type Role = "SUPER_ADMIN" | "ADMIN" | "TECHNICIAN" | "CUSTOMER";
export type Permission =
  | "TICKET_DELETE"
  | "TICKET_DUPLICATE"
  | "TICKET_REASSIGN"
  | "TECH_MANAGE"
  | "DEPT_MANAGE";

export type Me = {
  id: string;
  email: string;
  name: string;
  role: Role;
  orgId: string | null;
  permissions: Permission[];
};

export async function login(email: string, password: string) {
  const { data } = await api.post("/auth/login", { email, password });
  const accessToken: string = data.accessToken;
  localStorage.setItem("accessToken", accessToken);
  setAuthToken(accessToken);
  return accessToken;
}

export async function logout() {
  localStorage.removeItem("accessToken");
  setAuthToken(null);
}

export function initAuthFromStorage() {
  const token = localStorage.getItem("accessToken");
  setAuthToken(token);
  return token;
}

export async function me() {
  try {
    const res = await api.get("/auth/me");
    return res.data;
  } catch (err: any) {
    if (err?.response?.status === 401) return null;
    throw err;
  }
}
