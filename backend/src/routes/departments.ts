import { Router } from "express";
import { prisma } from "../lib/prisma.js";

export const departmentsRouter = Router();

// GET /departments/hospital
departmentsRouter.get("/hospital", async (_req, res, next) => {
  try {
    const items = await prisma.department.findMany({ where: { type: "HOSPITAL" }, orderBy: { name: "asc" } });
    res.json({ items });
  } catch (e) {
    next(e);
  }
});

// GET /departments/tech
departmentsRouter.get("/tech", async (_req, res, next) => {
  try {
    const items = await prisma.department.findMany({ where: { type: "TECH" }, orderBy: { name: "asc" } });
    res.json({ items });
  } catch (e) {
    next(e);
  }
});
