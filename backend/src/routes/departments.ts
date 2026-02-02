import { Router } from "express";
import { getHospitalDepartments, getTechDepartments } from "../services/departments.service.js";

export const departmentsRouter = Router();

departmentsRouter.get("/hospital", async (_req, res) => {
  const items = await getHospitalDepartments();
  return res.json({ items });
});

departmentsRouter.get("/tech", async (_req, res) => {
  const items = await getTechDepartments();
  return res.json({ items });
});
