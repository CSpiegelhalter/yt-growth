/**
 * Grant Pro plan to a user by email
 * 
 * Usage:
 * DIRECT_DATABASE_URL="..." DATABASE_URL="..." npx tsx scripts/grant-pro.ts user@example.com
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  
  if (!email) {
    console.error("Usage: npx tsx scripts/grant-pro.ts <email>");
    process.exit(1);
  }

  console.log(`Looking up user: ${email}`);
  
  const user = await prisma.user.findUnique({
    where: { email },
    include: { Subscription: true },
  });

  if (!user) {
    console.error(`❌ User not found: ${email}`);
    process.exit(1);
  }

  console.log(`Found user: id=${user.id}, name=${user.name}`);

  // Set currentPeriodEnd to 1 year from now
  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

  if (user.Subscription) {
    // Update existing subscription
    const updated = await prisma.subscription.update({
      where: { userId: user.id },
      data: {
        plan: "pro",
        status: "active",
        channelLimit: 5, // Pro plan channel limit
        currentPeriodEnd: oneYearFromNow,
        cancelAtPeriodEnd: false,
        cancelAt: null,
        canceledAt: null,
      },
    });
    console.log(`✅ Updated subscription to Pro plan`);
    console.log(`   Plan: ${updated.plan}`);
    console.log(`   Status: ${updated.status}`);
    console.log(`   Channel Limit: ${updated.channelLimit}`);
    console.log(`   Expires: ${updated.currentPeriodEnd?.toISOString()}`);
  } else {
    // Create new subscription
    const created = await prisma.subscription.create({
      data: {
        userId: user.id,
        plan: "pro",
        status: "active",
        channelLimit: 5, // Pro plan channel limit
        currentPeriodEnd: oneYearFromNow,
      },
    });
    console.log(`✅ Created Pro subscription`);
    console.log(`   Plan: ${created.plan}`);
    console.log(`   Status: ${created.status}`);
    console.log(`   Channel Limit: ${created.channelLimit}`);
    console.log(`   Expires: ${created.currentPeriodEnd?.toISOString()}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
