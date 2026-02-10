import { prisma } from "../lib/prisma.js";

export async function getHospitalDepartments() {
  return prisma.department.findMany({
    where: { type: "HOSPITAL", isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}

export async function getTechDepartments() {
  return prisma.department.findMany({
    where: { type: "TECH", isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}
