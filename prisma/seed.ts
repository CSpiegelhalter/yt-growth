/**
 * Database seed script
 *
 * Creates initial data for development.
 * Run with: npm run db:seed
 */
import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...\n");

  const email = "user@example.com";
  const password = "Password123!";
  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: "Dev User",
      passwordHash,
    },
  });
  console.log(`✅ Created dev user: ${user.email} (password: ${password})`);

  console.log("\n✨ Seed completed!\n");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
