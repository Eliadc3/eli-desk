import { Router } from "express";
import { adminTicketStatusesRouter } from "./ticket-statuses.js";
import { adminDepartmentsRouter } from "./departments.js";
import { adminTechniciansRouter } from "./technicians.js";
import { adminTicketActionsRouter } from "./ticket-actions.js";

export const adminRouter = Router();

adminRouter.use(adminTicketStatusesRouter);
adminRouter.use(adminDepartmentsRouter);
adminRouter.use(adminTechniciansRouter);
adminRouter.use(adminTicketActionsRouter);
