import { prisma } from "./lib/prisma.js";
import { env } from "./lib/env.js";

export async function bootstrapAppData() {
  // Organization
  await prisma.organization.upsert({
    where: { id: env.APP_ORG_ID },
    update: {},
    create: {
      id: env.APP_ORG_ID,
      name: "Default Organization",
    },
  });

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


  // Counter
  await prisma.counter.upsert({
    where: { key: "ticketNumber" },
    update: {},
    create: { key: "ticketNumber", value: 1000 },
  });
}
