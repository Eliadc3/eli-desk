/// <reference types="node" />
import { PrismaClient, Role, TicketPriority, TicketStatus, Permission } from "@prisma/client";
import bcrypt from "bcryptjs";


const prisma = new PrismaClient();

function randChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

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

async function main() {
  await ensureCounter();

  const passwordHash = await bcrypt.hash("admin1234", 10);

  const org = await prisma.organization.upsert({
    where: { id: "demo-org" },
    update: {},
    create: { id: "demo-org", name: "Demo Org" },
  });

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

  // Create some tickets
  const subjects = [
    "Printer not printing",
    "VPN connection drops",
    "Laptop is slow",
    "Need access to shared folder",
    "Email not syncing on phone",
  ];

  for (let i = 0; i < 12; i++) {
  const number = await nextTicketNumber();
  const status = randChoice([
    TicketStatus.NEW,
    TicketStatus.IN_PROGRESS,
    TicketStatus.WAITING_ON_CUSTOMER,
    TicketStatus.RESOLVED,
    TicketStatus.CLOSED,
  ]);
  const priority = randChoice([
    TicketPriority.LOW,
    TicketPriority.MEDIUM,
    TicketPriority.HIGH,
    TicketPriority.URGENT,
  ]);

  const isDone = status === TicketStatus.RESOLVED || status === TicketStatus.CLOSED;

  const created = await prisma.ticket.create({
    data: {
      number,
      subject: randChoice(subjects),
      description: "Demo ticket description",
      status,
      priority,

      org: { connect: { id: org.id } },

      hospitalDepartment: {
        connect: { id: randChoice([hospDeptER.id, hospDeptLab.id]) },
      },

      requester: { connect: { id: customer.id } },
      assignee: { connect: { id: randChoice([randChoice(techs).id, admin.id]) } },

      resolutionSummary: isDone ? "Issue resolved (demo)" : null,
      resolutionDetails: isDone ? "Steps taken: ... (demo)" : null,
      resolvedAt: isDone ? new Date() : null,
      closedAt: status === TicketStatus.CLOSED ? new Date() : null,

      ...(isDone ? { resolvedBy: { connect: { id: randChoice(techs).id } } } : {}),
    },
    select: { id: true }, 
  });

  await prisma.ticketActivity.create({
    data: {
      ticketId: created.id,
      actorId: customer.id, 
      type: "created",
      message: "Ticket created",
    },
  });
}

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
