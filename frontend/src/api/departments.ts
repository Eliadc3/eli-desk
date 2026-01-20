import { api } from "./client";

export type DepartmentType = "TECH" | "HOSPITAL";
export type Department = { id: string; name: string; type: DepartmentType };

export async function listHospitalDepartments() {
  const { data } = await api.get("/departments/hospital");
  return data.items as Department[];
}

export async function listTechDepartments() {
  const { data } = await api.get("/departments/tech");
  return data.items as Department[];
}

// public (no auth) for external form
export async function listHospitalDepartmentsPublic() {
  const { data } = await api.get("/public/hospital-departments");
  return data.items as Department[];
}
