/**
 * Database seed script
 *
 * Creates demo data for local development and testing.
 * Run with: npm run db:seed
 */
import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { LIMITS } from "@/lib/product";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...\n");

  // Create demo user
  const passwordHash = await bcrypt.hash("demo123", 12);
  const demoUser = await prisma.user.upsert({
    where: { email: "demo@example.com" },
    update: {},
    create: {
      email: "demo@example.com",
      name: "Demo User",
      passwordHash,
    },
  });
  console.log(`✅ Created demo user: ${demoUser.email} (password: demo123)`);

  // Create subscription for demo user (active pro)
  const subscription = await prisma.subscription.upsert({
    where: { userId: demoUser.id },
    update: {
      status: "active",
      plan: "pro",
      channelLimit: LIMITS.PRO_MAX_CONNECTED_CHANNELS,
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    create: {
      userId: demoUser.id,
      status: "active",
      plan: "pro",
      channelLimit: LIMITS.PRO_MAX_CONNECTED_CHANNELS,
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      stripeCustomerId: "cus_demo_12345",
      stripeSubscriptionId: "sub_demo_12345",
    },
  });
  console.log(`✅ Created subscription: ${subscription.plan} (${subscription.status})`);

  // Create demo channel
  const demoChannel = await prisma.channel.upsert({
    where: {
      userId_youtubeChannelId: {
        userId: demoUser.id,
        youtubeChannelId: "UC_demo_channel_123",
      },
    },
    update: {},
    create: {
      userId: demoUser.id,
      youtubeChannelId: "UC_demo_channel_123",
      title: "Demo Tech Channel",
      thumbnailUrl: "https://yt3.ggpht.com/demo-thumb",
      lastSyncedAt: new Date(),
      syncStatus: "idle",
    },
  });
  console.log(`✅ Created demo channel: ${demoChannel.title}`);

  // Create demo videos
  const videoData = [
    {
      youtubeVideoId: "vid_demo_001",
      title: "Building a SaaS in 24 Hours",
      description: "I challenged myself to build a complete SaaS...",
      publishedAt: new Date("2024-01-15"),
      durationSec: 1245,
      tags: "saas,startup,coding",
      thumbnailUrl: "https://i.ytimg.com/vi/demo1/hqdefault.jpg",
    },
    {
      youtubeVideoId: "vid_demo_002",
      title: "Why I Quit My Tech Job",
      description: "After 5 years at FAANG...",
      publishedAt: new Date("2024-01-08"),
      durationSec: 890,
      tags: "career,tech,life",
      thumbnailUrl: "https://i.ytimg.com/vi/demo2/hqdefault.jpg",
    },
    {
      youtubeVideoId: "vid_demo_003",
      title: "The BEST VS Code Setup for 2024",
      description: "My complete VS Code configuration...",
      publishedAt: new Date("2024-01-01"),
      durationSec: 720,
      tags: "vscode,productivity,coding",
      thumbnailUrl: "https://i.ytimg.com/vi/demo3/hqdefault.jpg",
    },
  ];

  for (const data of videoData) {
    const video = await prisma.video.upsert({
      where: {
        channelId_youtubeVideoId: {
          channelId: demoChannel.id,
          youtubeVideoId: data.youtubeVideoId,
        },
      },
      update: {},
      create: {
        channelId: demoChannel.id,
        ...data,
      },
    });
    console.log(`✅ Created video: ${video.title}`);

    // Create metrics for video
    await prisma.videoMetrics.upsert({
      where: { videoId: video.id },
      update: {},
      create: {
        videoId: video.id,
        channelId: demoChannel.id,
        views: Math.floor(Math.random() * 200000) + 50000,
        likes: Math.floor(Math.random() * 10000) + 2000,
        comments: Math.floor(Math.random() * 500) + 100,
        shares: Math.floor(Math.random() * 200) + 50,
        subscribersGained: Math.floor(Math.random() * 1000) + 200,
        subscribersLost: Math.floor(Math.random() * 50) + 10,
        estimatedMinutesWatched: Math.floor(Math.random() * 100000) + 20000,
        averageViewDuration: Math.floor(Math.random() * 200) + 100,
        averageViewPercentage: Math.floor(Math.random() * 30) + 30,
        cachedUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });
  }

  // Create demo plan
  const demoPlan = await prisma.plan.create({
    data: {
      userId: demoUser.id,
      channelId: demoChannel.id,
      inputsJson: JSON.stringify({
        channelTitle: demoChannel.title,
        recentVideoTitles: videoData.map((v) => v.title),
        topPerformingTitles: videoData.map((v) => v.title),
        nicheKeywords: ["coding", "tech", "productivity"],
      }),
      outputMarkdown: `## 🎯 Best Next Video Topic
**"5 VS Code Extensions That Will 10x Your Productivity"**
This topic combines your proven productivity niche with specific, curiosity-driving numbers.

### Alternative Topics
1. "I Tried Every AI Coding Assistant - Here's the Winner"
2. "The Terminal Setup Senior Developers Don't Share"

## 📝 Title Options
1. "5 VS Code Extensions That Will 10x Your Productivity" - Number + benefit
2. "I Found the BEST VS Code Setup After 5 Years" - Personal journey + authority
3. "Stop Using VS Code Wrong (Do This Instead)" - Challenge + solution

## 🖼️ Thumbnail Guidance
- Use a split composition: your face (surprised expression) on left, VS Code logo on right
- Bold yellow/orange accent color on dark background
- Large "10x" text overlay
- Clean, minimal - avoid clutter

## 🏷️ Top 5 Tags/Keywords
1. vscode extensions
2. developer productivity
3. coding setup
4. best ide extensions
5. programming tools 2024

## ✅ One-Week Checklist
- [ ] Day 1: Research and test 10 extensions, narrow to top 5
- [ ] Day 2: Write script with hook and timestamps
- [ ] Day 3: Record main footage with screen recordings
- [ ] Day 4: Record B-roll and reaction shots
- [ ] Day 5: Edit video, add captions and graphics
- [ ] Day 6: Create thumbnail, write description and tags
- [ ] Day 7: Schedule publish, prepare community post`,
      modelVersion: "gpt-4o-mini",
      tokensUsed: 450,
      cachedUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });
  console.log(`✅ Created demo plan (ID: ${demoPlan.id})`);

  // Create a second test user without subscription
  const freeUser = await prisma.user.upsert({
    where: { email: "free@example.com" },
    update: {},
    create: {
      email: "free@example.com",
      name: "Free User",
      passwordHash,
    },
  });
  console.log(`✅ Created free user: ${freeUser.email} (password: demo123)`);

  console.log("\n✨ Seed completed!\n");
  console.log("Login credentials:");
  console.log("  Pro user:  demo@example.com / demo123");
  console.log("  Free user: free@example.com / demo123");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

