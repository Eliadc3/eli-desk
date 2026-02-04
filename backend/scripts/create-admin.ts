import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // שנה את הערכים האלה:
  const name = "Admin";
  const username = "Admin";
  const password = "admin1234";

  const passwordHash = await bcrypt.hash(password, 10);

  // אם יש לך orgId חובה – תביא אחד קיים או צור אחד כאן
  const user = await prisma.user.create({
    data: {
      username: "admin",
      name: "Admin",
      passwordHash,
      role: "SUPER_ADMIN", // או SUPER_ADMIN לפי הסכימה שלך
      orgId: "..." // אם חובה אצלך
      // username: "admin" // אם יש אצלך username unique
    },
    select: { id: true, username: true, name: true, role: true },
  });

  console.log("Created admin:", user);
  console.log("Password:", password);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
