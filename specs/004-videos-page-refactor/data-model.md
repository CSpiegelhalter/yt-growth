# Data Model: Videos Page Refactor

**Feature**: 004-videos-page-refactor
**Date**: 2026-03-10

## New Entity: VideoIdea

A user-owned planned video concept that can be created, edited, and refined over time with optional AI assistance.

### Prisma Model

```prisma
model VideoIdea {
  id          String    @id @default(uuid()) @db.Uuid
  userId      Int
  channelId   Int
  summary     String    @db.VarChar(150)
  title       String?   @db.VarChar(500)
  script      String?   @db.Text
  description String?   @db.Text
  tags        String?   @db.Text          // JSON array of strings
  postDate    DateTime? @db.Date
  status      String    @default("draft") @db.VarChar(16)
  createdAt   DateTime  @default(now()) @db.Timestamptz(6)
  updatedAt   DateTime  @default(now()) @updatedAt @db.Timestamptz(6)

  User    User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  Channel Channel @relation(fields: [channelId], references: [id], onDelete: Cascade)

  @@index([userId, channelId, status], map: "idx_video_idea_user_channel_status")
  @@index([userId, createdAt(sort: Desc)], map: "idx_video_idea_user_created")
}
```

### Fields

| Field | Type | Required | Constraints | Notes |
|-------|------|----------|-------------|-------|
| id | UUID | Yes | Auto-generated | Primary key |
| userId | Int | Yes | FK → User | Owner |
| channelId | Int | Yes | FK → Channel | Associated channel |
| summary | VarChar(150) | Yes | Max 150 chars | Quick video concept description |
| title | VarChar(500) | No | — | Video title (can be AI-suggested) |
| script | Text | No | — | Video script content (multi-line) |
| description | Text | No | — | YouTube description (can be AI-suggested) |
| tags | Text | No | JSON array | Stored as JSON string array |
| postDate | Date | No | — | Planned publish date |
| status | VarChar(16) | Yes | Default "draft" | Lifecycle state |
| createdAt | Timestamptz | Yes | Auto-generated | Creation timestamp |
| updatedAt | Timestamptz | Yes | Auto-updated | Last modification timestamp |

### Status Values

| Status | Meaning | Transitions To |
|--------|---------|---------------|
| `draft` | Initial state, being workshopped | `planned`, (future: `archived`) |
| `planned` | Ready to produce/publish | `draft`, (future: `archived`, `published`) |

Only `draft` and `planned` are implemented for MVP. The status field is extensible for future workflow states.

### Indexes

- `(userId, channelId, status)` — list ideas by channel, filter by status
- `(userId, createdAt DESC)` — list all user ideas ordered by recency

### Relationships

- **User** (many-to-one): A user can have many video ideas. Cascade delete.
- **Channel** (many-to-one): A video idea belongs to one channel. Cascade delete.

### Required Schema Changes

1. Add `VideoIdea` model to `apps/web/prisma/schema.prisma`
2. Add `videoIdeas VideoIdea[]` relation to `User` model
3. Add `videoIdeas VideoIdea[]` relation to `Channel` model
4. Generate and apply migration: `bunx prisma migrate dev --name add_video_ideas`

---

## Existing Entities (Referenced, Not Modified)

### VideoSuggestion (existing)

Used by the dashboard suggestions feature. **Not modified** for this feature. The `buildContext()` use-case from suggestions is reused to assemble context for AI field generation, but the model itself is separate.

### Video + VideoMetrics (existing)

Published video data. **Not modified**. Referenced by the Published tab's existing video list and analysis panel.

---

## TypeScript Types

### VideoIdea (domain type)

```typescript
type VideoIdeaStatus = "draft" | "planned";

type VideoIdea = {
  id: string;
  channelId: number;
  summary: string;
  title: string | null;
  script: string | null;
  description: string | null;
  tags: string[];
  postDate: string | null;  // ISO date string
  status: VideoIdeaStatus;
  createdAt: string;
  updatedAt: string;
};
```

### CreateIdeaInput

```typescript
type CreateIdeaInput = {
  userId: number;
  channelId: number;
  summary: string;
  title?: string;
  script?: string;
  description?: string;
  tags?: string[];
  postDate?: string;
};
```

### UpdateIdeaInput

```typescript
type UpdateIdeaInput = {
  summary?: string;
  title?: string | null;
  script?: string | null;
  description?: string | null;
  tags?: string[];
  postDate?: string | null;
  status?: VideoIdeaStatus;
};
```

### SuggestFieldInput

```typescript
type SuggestableField = "title" | "script" | "description" | "tags" | "postDate";

type SuggestFieldInput = {
  userId: number;
  channelId: number;
  field: SuggestableField;
  currentIdea: Partial<VideoIdea>;
};

type SuggestFieldResult = {
  field: SuggestableField;
  value: string;  // Generated content (tags returned as JSON array string)
};
```

---

## Validation Schemas (Zod)

```typescript
const IdeaParamsSchema = z.object({
  channelId: z.string().min(1),
});

const IdeaDetailParamsSchema = z.object({
  channelId: z.string().min(1),
  ideaId: z.string().uuid(),
});

const CreateIdeaBodySchema = z.object({
  summary: z.string().min(1).max(150),
  title: z.string().max(500).optional(),
  script: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  postDate: z.string().date().optional(),
});

const UpdateIdeaBodySchema = z.object({
  summary: z.string().min(1).max(150).optional(),
  title: z.string().max(500).nullable().optional(),
  script: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  postDate: z.string().date().nullable().optional(),
  status: z.enum(["draft", "planned"]).optional(),
});

const SuggestFieldBodySchema = z.object({
  field: z.enum(["title", "script", "description", "tags", "postDate"]),
  currentIdea: z.object({
    summary: z.string().optional(),
    title: z.string().nullable().optional(),
    script: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    tags: z.array(z.string()).optional(),
    postDate: z.string().nullable().optional(),
  }),
});
```
