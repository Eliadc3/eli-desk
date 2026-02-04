import bcrypt from "bcryptjs";
import { prisma } from "./lib/prisma.js";
import { env } from "./lib/env.js";

export async function bootstrapAppData() {
  // 1) Organization
  await prisma.organization.upsert({
    where: { id: env.APP_ORG_ID },
    update: {},
    create: {
      id: env.APP_ORG_ID,
      name: "Default Organization",
    },
  });

  // 2) Departments (TECH + HOSPITAL) – נדרש בגלל FK ב-Ticket
  const techDept = await prisma.department.upsert({
    where: { name_type: { name: "IT", type: "TECH" } },
    update: {},
    create: {
      name: "IT",
      type: "TECH",
    },
    select: { id: true },
  });

  const hospitalDept = await prisma.department.upsert({
    where: { name_type: { name: "כללי", type: "HOSPITAL" } },
    update: {},
    create: {
      name: "כללי",
      type: "HOSPITAL",
    },
    select: { id: true },
  });

  // 3) Ticket Status (default)
  await prisma.ticketStatus.upsert({
    where: { orgId_key: { orgId: env.APP_ORG_ID, key: "NEW" } },
    update: {},
    create: {
      orgId: env.APP_ORG_ID,
      key: "NEW",
      labelHe: "חדש",
      isDefault: true,
      sortOrder: 0,
    },
  });

  // 4) Counter
  await prisma.counter.upsert({
    where: { key: "ticketNumber" },
    update: {},
    create: { key: "ticketNumber", value: 1000 },
  });

  // 5) Admin user (username + passwordHash)
  // מומלץ לשים את הערכים ב-.env, אבל אם אין לך כרגע – זה בסדר להתחיל ככה
  const adminUsername = env.ADMIN_USERNAME ?? "admin";
  const adminPassword = env.ADMIN_PASSWORD ?? "admin1234";

  const passwordHash = await bcrypt.hash(adminPassword, 10);

  await prisma.user.upsert({
    where: { username: adminUsername },
    update: {}, // לא משנים אוטומטית סיסמה אם כבר קיים
    create: {
      username: adminUsername,
      name: "Admin",
      passwordHash,
      role: "ADMIN",
      orgId: env.APP_ORG_ID,
      techDepartmentId: techDept.id,
    },
  });

  // (אופציונלי) לוג שיעזור לך בבדיקות
  console.log("Bootstrap OK ✅");
  console.log("Admin:", { username: adminUsername, password: adminPassword });
  console.log("Hospital Department ID:", hospitalDept.id);
}
