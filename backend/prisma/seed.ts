/// <reference types="node" />
import { PrismaClient, Role, TicketPriority, Permission } from "@prisma/client";
import bcrypt from "bcryptjs";


const prisma = new PrismaClient();

function randChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const org = await prisma.organization.upsert({
  where: { id: "demo-org" },
  update: {},
  create: { id: "demo-org", name: "Demo Org" },
});

async function ensureCounter() {
  await prisma.counter.upsert({
    where: { key: "ticketNumber" },
    update: {},
    create: { key: "ticketNumber", value: 1000 },
  });
}

async function nextTicketNumber() {
  const c = await prisma.counter.update({
    where: { key: "ticketNumber" },
    data: { value: { increment: 1 } },
  });
  return c.value;
}

async function ensureHebrewTicketStatuses(orgId: string) {
  const existing = await prisma.ticketStatus.count({ where: { orgId } });
  if (existing > 0) return;

  await prisma.ticketStatus.createMany({
    data: [
      { orgId, key: "open", labelHe: "פתוח", sortOrder: 1, isDefault: true, isActive: true },
      { orgId, key: "in_progress", labelHe: "בטיפול", sortOrder: 2, isActive: true },
      { orgId, key: "waiting_customer", labelHe: "ממתין ללקוח", sortOrder: 3, isActive: true },
      { orgId, key: "waiting_vendor", labelHe: "ממתין לספק", sortOrder: 4, isActive: true },
      { orgId, key: "closed", labelHe: "נסגר", sortOrder: 5, isActive: true },
    ],
  });
}


async function main() {
  await ensureCounter();
  const org = await prisma.organization.upsert({
    where: { id: "demo-org" },
    update: {},
    create: { id: "demo-org", name: "Demo Org" },
  });
  await ensureHebrewTicketStatuses(org.id);

  const passwordHash = await bcrypt.hash("admin1234", 10);


  const techDept = await prisma.department.upsert({
    where: { name_type: { name: "IT - Helpdesk", type: "TECH" } },
    update: {},
    create: { name: "IT - Helpdesk", type: "TECH" },
  });

  const hospDeptER = await prisma.department.upsert({
    where: { name_type: { name: "Emergency", type: "HOSPITAL" } },
    update: {},
    create: { name: "Emergency", type: "HOSPITAL" },
  });

  const hospDeptLab = await prisma.department.upsert({
    where: { name_type: { name: "Laboratory", type: "HOSPITAL" } },
    update: {},
    create: { name: "Laboratory", type: "HOSPITAL" },
  });


  const admin = await prisma.user.upsert({
    where: { email: "admin@eli-desk.local" },
    update: {},
    create: {
      email: "admin@eli-desk.local",
      name: "Admin",
      passwordHash,
      role: Role.SUPER_ADMIN,
      org: { connect: { id: org.id } },
    },
  });

  const techs: { id: string }[] = [];
  for (let i = 1; i <= 20; i++) {
    const email = `tech${String(i).padStart(2, "0")}@eli-desk.local`;
    const t = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        name: `Tech ${String(i).padStart(2, "0")}`,
        passwordHash: await bcrypt.hash("tech1234", 10),
        role: Role.TECHNICIAN,
        org: { connect: { id: org.id } },
        techDepartment: { connect: { id: techDept.id } },
      },
      select: { id: true },
    });
    techs.push(t);
  }

  const powerTechEmails = ["tech01@eli-desk.local", "tech02@eli-desk.local"];

  const powerTechs = await prisma.user.findMany({
    where: { email: { in: powerTechEmails } },
    select: { id: true },
  });

  for (const t of powerTechs) {
    await prisma.userPermission.deleteMany({
      where: { userId: t.id },
    });

    await prisma.userPermission.createMany({
      data: [
        { userId: t.id, perm: Permission.TICKET_DELETE },
        { userId: t.id, perm: Permission.TICKET_DUPLICATE },
        { userId: t.id, perm: Permission.TICKET_REASSIGN },
        { userId: t.id, perm: Permission.TECH_MANAGE },
        { userId: t.id, perm: Permission.DEPT_MANAGE },
      ],
    });
  }


  const customer = await prisma.user.upsert({
    where: { email: "customer@eli-desk.local" },
    update: {},
    create: {
      email: "customer@eli-desk.local",
      name: "Customer",
      passwordHash: await bcrypt.hash("cust1234", 10),
      role: Role.CUSTOMER,
      org: { connect: { id: org.id } },
    },
    select: { id: true },
  });

  

  const priority = randChoice([
    TicketPriority.LOW,
    TicketPriority.MEDIUM,
    TicketPriority.HIGH,
    TicketPriority.URGENT,
  ]);

  console.log("Seed completed.");
  console.log("Login users:");
  console.log("Super Admin: admin@eli-desk.local / admin1234");
  console.log("Tech:  tech01@eli-desk.local / tech1234 (also tech02..tech20)");
  console.log("Cust:  customer@eli-desk.local / cust1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
