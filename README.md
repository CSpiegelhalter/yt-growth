# YouTube Growth Consultant - Frontend

YouTube growth tools built with Next.js 14, Prisma, and TypeScript.

## 🎯 MVP Features

### Core Deliverables

1. **Decide-for-Me Plan** (paid feature)
   - Generate content plans with:
     - 1 best next video topic + 2 alternates
     - 3 title options
     - Thumbnail guidance (no image generation)
     - Top 5 tags/keywords
     - One-week checklist
   - Plans cached for 24 hours

2. **Video Analysis** (paid feature)
   - For last 10 uploads, compute:
     - Timestamp where retention crosses 50% OR steepest drop
     - Hypothesis + 3 fixes
   - Lazy-loaded when user visits audit page
   - Cached for 12-24 hours

3. **Subscriber Magnet Audit** (paid feature)
   - Top 3 videos by subs gained per 1k views
   - Pattern summary

---

## 📱 User Journeys (Happy Path)

### Journey 1: New User Signup → Connect YouTube
1. User lands on `/` (landing page)
2. Clicks "Start Free Trial" → `/auth/signup`
3. Creates account with email/password
4. Redirected to `/dashboard`
5. Clicks "Connect YouTube" → OAuth flow
6. YouTube channel appears in dashboard

### Journey 2: Subscribe → Unlock Features
1. User sees "Subscribe" CTA in dashboard
2. Clicks → Stripe Checkout
3. Completes payment
4. Redirected to `/dashboard?checkout=success`
5. All paid features unlocked

### Journey 3: Generate Plan
1. User with subscription visits dashboard
2. Clicks "Generate Plan" on channel card
3. Plan generated (uses cached data if available)
4. Plan displayed in expandable card
5. Plan saved to history

### Journey 4: View Audit
1. User clicks "View Full Audit" link
2. Navigates to `/audit/[channelId]`
3. Tabs: Video Analysis | Subscriber Magnets | Plans
4. Data lazy-loaded per tab
5. Results cached for 12 hours

---

## 📄 Expected Behavior by Page

### `/` (Landing Page)
- **Auth**: Public
- **Content**: Hero, features, how-it-works, CTA
- **SEO**: Full metadata, Open Graph tags

### `/auth/login`
- **Auth**: Public (redirects if logged in)
- **Behavior**: Email/password login
- **Redirect**: `/dashboard` on success

### `/auth/signup`
- **Auth**: Public (redirects if logged in)
- **Behavior**: Create account with email/password
- **Redirect**: `/dashboard` on success

### `/dashboard`
- **Auth**: Required (middleware protected)
- **Content**: 
  - Connected channels list with sync status
  - Latest plan for selected channel
  - Billing CTA (subscribe or manage)
  - Quick links to audit
- **State indicators**: Last synced timestamps, cache status

### `/audit/[channelId]`
- **Auth**: Required
- **Subscription**: Required for data (shows upgrade CTA if not)
- **Tabs**:
  - Retention Cliffs: Table of videos with cliff timestamps
  - Subscriber Magnets: Top 3 videos + pattern analysis
  - Plans: Latest plan + history
- **Lazy loading**: Data fetched when tab activated

### `/profile`
- **Auth**: Required
- **Content**:
  - Account info (email, plan, status)
  - Subscription management (subscribe/manage billing)
  - Connected channels list
  - Danger zone (delete account placeholder)

---

## 🔌 API Routes

### Authentication & User

| Route | Method | Auth | Subscription | Description |
|-------|--------|------|--------------|-------------|
| `/api/me` | GET | ✅ | - | Get current user with subscription status |
| `/api/auth/[...nextauth]` | * | - | - | NextAuth.js handlers |
| `/api/auth/signup` | POST | - | - | Create new account |

**GET /api/me Response:**
```json
{
  "id": 1,
  "email": "user@example.com",
  "name": "User Name",
  "plan": "pro",
  "status": "active",
  "channel_limit": 5,
  "subscription": {
    "isActive": true,
    "currentPeriodEnd": "2024-02-15T00:00:00.000Z"
  }
}
```

### Channels

| Route | Method | Auth | Subscription | Description |
|-------|--------|------|--------------|-------------|
| `/api/me/channels` | GET | ✅ | - | List user's connected channels |
| `/api/me/channels/[id]` | GET | ✅ | - | Get channel details |
| `/api/me/channels/[id]` | DELETE | ✅ | - | Unlink channel |
| `/api/me/channels/[id]/sync` | POST | ✅ | - | Sync channel videos & metrics |

**GET /api/me/channels Response:**
```json
{
  "channels": [
    {
      "channel_id": "UC_abc123",
      "id": 1,
      "title": "My Tech Channel",
      "thumbnailUrl": "https://...",
      "connectedAt": "2024-01-01T00:00:00.000Z",
      "lastSyncedAt": "2024-01-15T12:00:00.000Z",
      "syncStatus": "idle",
      "syncError": null,
      "videoCount": 10,
      "planCount": 3
    }
  ],
  "channelLimit": 1,
  "plan": "FREE"
}
```

### Paid Features

| Route | Method | Auth | Subscription | Cache TTL | Rate Limit |
|-------|--------|------|--------------|-----------|------------|
| `/api/me/channels/[id]/retention` | GET | ✅ | ✅ | 12h | 20/hour |
| `/api/me/channels/[id]/plan/generate` | POST | ✅ | ✅ | 24h | 5/hour |
| `/api/me/channels/[id]/plans` | GET | ✅ | - | - | - |
| `/api/me/channels/[id]/subscriber-audit` | GET | ✅ | ✅ | 12h | - |

**GET /api/me/channels/[id]/retention Response:**
```json
{
  "channelId": "UC_abc123",
  "videos": [
    {
      "videoId": "vid123",
      "title": "Building a SaaS in 24 Hours",
      "durationSec": 1245,
      "publishedAt": "2024-01-15T10:00:00.000Z",
      "retention": {
        "hasData": true,
        "cliffTimeSec": 180,
        "cliffTimestamp": "3:00",
        "cliffReason": "crossed_50",
        "cliffSlope": -0.02,
        "fetchedAt": "2024-01-15T12:00:00.000Z",
        "cachedUntil": "2024-01-16T00:00:00.000Z"
      }
    }
  ],
  "fetchedAt": "2024-01-15T12:00:00.000Z"
}
```

**POST /api/me/channels/[id]/plan/generate Response:**
```json
{
  "plan": {
    "id": 1,
    "outputMarkdown": "## 🎯 Best Next Video Topic\n...",
    "createdAt": "2024-01-15T12:00:00.000Z",
    "cachedUntil": "2024-01-16T12:00:00.000Z",
    "fromCache": false,
    "tokensUsed": 450
  },
  "rateLimit": {
    "remaining": 4,
    "resetAt": "2024-01-15T13:00:00.000Z"
  }
}
```

**GET /api/me/channels/[id]/subscriber-audit Response:**
```json
{
  "channelId": "UC_abc123",
  "topVideos": [
    {
      "videoId": "vid123",
      "title": "Complete Beginner Guide to...",
      "views": 210000,
      "subscribersGained": 1450,
      "subsPerThousand": 6.9,
      "publishedAt": "2024-01-01T10:00:00.000Z",
      "thumbnailUrl": "https://..."
    }
  ],
  "analysis": "## Subscriber Magnet Pattern Analysis\n...",
  "stats": {
    "totalVideosAnalyzed": 50,
    "avgSubsPerThousand": 2.5,
    "totalSubscribersGained": 5000,
    "totalViews": 2000000
  },
  "fetchedAt": "2024-01-15T12:00:00.000Z"
}
```

### Integrations

| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/api/integrations/google/start` | GET | ✅ | Start Google OAuth flow |
| `/api/integrations/google/callback` | GET | - | Google OAuth callback |
| `/api/integrations/stripe/checkout` | POST | ✅ | Create Stripe checkout session |
| `/api/integrations/stripe/webhook` | POST | - | Handle Stripe webhooks |

### Internal/Cron

| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/api/private/cron/refresh` | POST | X-CRON-SECRET | Refresh caches for active users |

---

## 🚀 Local Development Setup

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- npm or bun

### Step 1: Clone and Install
```bash
npm install
```

### Step 2: Start PostgreSQL
```bash
npm run db:up
```

### Step 3: Configure Environment
```bash
cp env.example .env.local
# Edit .env.local with your values
```

**Required environment variables:**
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_URL` - App URL (http://localhost:3000)
- `NEXTAUTH_SECRET` - Random secret for NextAuth
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - Google OAuth
- `GOOGLE_OAUTH_REDIRECT` - OAuth callback URL
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` / `STRIPE_PRICE_ID` - Stripe
- `OPENAI_API_KEY` - OpenAI for plan generation
- `CRON_SECRET` - For cron endpoint

### Step 4: Run Migrations and Seed
```bash
npm run db:migrate
npm run db:seed
```

### Step 5: Start Development Server
```bash
npm run dev
```

Visit http://localhost:3000

---

## 🧪 Running Tests

### Unit Tests (Vitest)
```bash
npm run test:unit        # Run once
npm run test:unit:watch  # Watch mode
```

### E2E Tests (Playwright)
```bash
# First, ensure database is seeded
npm run db:seed

# Run tests
npm run test:e2e        # Headless
npm run test:e2e:ui     # Interactive UI
```

### All Tests
```bash
npm test
```

---

## 📦 NPM Scripts Reference

| Script | Description |
|--------|-------------|
| `dev` | Start Next.js dev server |
| `build` | Production build |
| `start` | Start production server |
| `lint` | Run ESLint |
| `typecheck` | Run TypeScript type check |
| `db:up` | Start PostgreSQL container |
| `db:down` | Stop PostgreSQL container |
| `db:reset` | Reset database (destroy + recreate + migrate) |
| `db:migrate` | Run Prisma migrations |
| `db:push` | Push schema without migrations |
| `db:seed` | Seed development database |
| `db:studio` | Open Prisma Studio |
| `test` | Run all tests |
| `test:unit` | Run unit tests |
| `test:e2e` | Run E2E tests |

---

## 📐 Architecture

```
yt-growth/
├── app/                    # Next.js App Router
│   ├── api/               # API route handlers
│   │   ├── me/            # User endpoints
│   │   ├── integrations/  # OAuth, Stripe
│   │   └── private/       # Internal endpoints
│   ├── auth/              # Auth pages
│   ├── dashboard/         # Dashboard page
│   ├── audit/             # Audit page
│   └── profile/           # Profile page
├── components/            # React components
│   └── dashboard/         # Dashboard-specific
├── lib/                   # Server utilities
│   ├── auth.ts           # NextAuth config
│   ├── google-tokens.ts  # Google OAuth helpers
│   ├── youtube-api.ts    # YouTube API client
│   ├── stripe.ts         # Stripe helpers
│   ├── llm.ts            # OpenAI wrapper
│   ├── retention.ts      # Retention cliff algorithm
│   ├── rate-limit.ts     # Rate limiting
│   └── user.ts           # User helpers
├── prisma/               # Database
│   ├── schema.prisma     # Schema definition
│   ├── client.ts         # Prisma client singleton
│   └── seed.ts           # Seed script
└── types/                # TypeScript types
```

---

## 🔒 Security Considerations

- All sensitive operations are server-only route handlers
- Input validation with Zod on all endpoints
- Subscription gating enforced server-side
- Google tokens never exposed to client
- Rate limiting on expensive operations
- CRON endpoint secured with header secret

---

## 📊 Example Plan Output

```markdown
## 🎯 Best Next Video Topic
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
- [ ] Day 7: Schedule publish, prepare community post
```

---

## 🎬 Recording for Google Verification

When submitting your app for Google OAuth verification, you need to record a demo video showing:
1. The OAuth consent screen on your **production domain**
2. The permissions being requested
3. The user granting access

### The Challenge

Google only shows the full consent screen when:
- It's the first time a user authorizes your app, OR
- The user has revoked access and is re-authorizing

For normal users, we use `prompt=select_account` to avoid unnecessary consent prompts. But for verification recordings, we need to force the consent screen.

### Solution: Verification Login

This app includes a "Verification Login" flow that forces Google's consent screen for demo recordings without affecting normal users.

### Setup (One-time)

Add the verification callback URL to your Google Cloud Console:

1. Go to [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials)
2. Edit your OAuth 2.0 Client ID
3. Under "Authorized redirect URIs", add:
   - `http://localhost:3000/auth/verify/callback` (development)
   - `https://your-production-domain.com/auth/verify/callback` (production)
4. Save

### How to Use

#### Step 1: Prepare

1. **Open an Incognito/Private browser window** (ensures clean state)
2. **Revoke previous access** (if any): Go to [myaccount.google.com/permissions](https://myaccount.google.com/permissions), find this app, and remove access

#### Step 2: Access Verification Login

**Option A: Via Query Parameter (recommended for ad-hoc use)**
```
https://your-domain.com/auth/login?verify=1
```

**Option B: In Development**
The "Verification Login" button appears automatically on `/auth/login` and `/auth/signup` in development mode.

**Option C: Enable in Production**
Set in your environment:
```bash
NEXT_PUBLIC_ENABLE_OAUTH_VERIFY_BUTTON="true"
```

#### Step 3: Record

1. Start screen recording
2. Click the **"Verification Login"** button (appears below Google sign-in)
3. Google will show the full consent screen with all scopes
4. Grant permission
5. You'll be redirected to the dashboard
6. Stop recording

### Technical Details

The Verification Login flow:
- Uses a custom OAuth flow at `/auth/verify` with `prompt=consent`
- **Requests ALL scopes** (including YouTube API) to show the full permission screen
- Custom callback handler at `/auth/verify/callback`
- CSRF protection via state parameter stored in httpOnly cookie
- Creates NextAuth-compatible session after successful auth
- Stores YouTube API tokens for immediate use after login

### Scopes Requested in Verification Flow

The verification flow requests these scopes to show the detailed consent screen:
- `openid` - Basic authentication
- `email` - Email address
- `profile` - Name and profile picture
- `youtube.readonly` - View YouTube account
- `youtube.force-ssl` - Manage YouTube account
- `yt-analytics.readonly` - View YouTube Analytics reports

### Security Notes

- Uses same Google OAuth credentials as main flow
- State parameter provides CSRF protection
- No tokens or codes are logged (only metadata)
- Normal users are never affected (separate flow)

---

## 🐛 Troubleshooting

### Database connection fails
```bash
# Check PostgreSQL is running
docker ps

# Restart if needed
npm run db:down
npm run db:up
```

### "Unauthorized" errors
- Check session is valid
- Verify NEXTAUTH_SECRET is set
- Try signing out and back in

### Rate limit exceeded
- Wait for reset time shown in error
- Reduce request frequency

### Google OAuth fails
- Verify redirect URI matches config
- Check scopes include youtube.readonly and yt-analytics.readonly
- Ensure consent screen is configured

---

## 🎨 UX Polish (December 2024)

### PlanCard Redesign
The `components/dashboard/PlanCard` was completely redesigned as a mobile-first "consultant deliverable":

- **Structured parsing**: New `lib/plan-parser.ts` extracts structured data from LLM markdown
- **Hero section**: Best video topic prominently displayed with copy button
- **Title options**: Tappable cards with rationale tags and individual copy buttons  
- **Thumbnail recipe**: Visual guidance in a highlighted box
- **Keywords**: Chip-style tags with copy-all and individual copy
- **Checklist**: Day-grouped tasks for easy execution
- **Copy functionality**: Toast notifications via `components/ui/Toast.tsx`

### Component Polish
- **EmptyState**: Beautiful empty state with feature highlights
- **RetentionTable**: Mobile card view + desktop table view
- **Profile page**: Consistent styling with CSS modules

### Design System
- Mobile-first (360px baseline)
- Touch targets ≥ 44px
- Consistent spacing, typography, and radius
- Skeleton loaders for all async states
- Toast notifications for copy feedback

---

## 🔧 Fix Log (Recent Changes)

### December 2024 Fixes

**FIX 1: Audit page infinite retention loop**
- **Problem**: `app/audit/[channelId]/page.tsx` was calling the retention endpoint in an infinite loop
- **Cause**: `useCallback` dependencies included state values that changed on every render
- **Solution**: Created `lib/use-retention.ts` hook with ref-based request deduping and AbortController
- **Test**: Added `lib/__tests__/use-retention.test.ts` to verify single-fetch behavior

**FIX 2: Header shows Login/Signup even when logged in**
- **Problem**: Header component showed wrong auth state
- **Solution**: Updated `components/Header.tsx` with proper client-side hydration handling and cleaner CSS

**FIX 3 & 4: Dashboard/ChannelSection/ChannelCard prop mismatch**
- **Problem**: Dashboard passed `onRefresh` but `ChannelsSection` expected `onSync`; `ChannelsSection` passed `onSync` but `ChannelCard` expected `onRefresh`
- **Solution**: Standardized on `onSync` prop name across all components

**FIX 5: Prisma schema validation**
- **Status**: Schema is valid for Prisma 5.22.0
- **Note**: The "datasource url no longer supported" error is from Prisma 7. This project uses Prisma 5.x where the current schema syntax is correct.

**Additional fixes (pre-existing issues)**:
- Fixed `lib/server-user.ts`: Subscription relation query (one-to-one, not one-to-many)
- Fixed `app/api/integrations/stripe/webhook/route.ts`: Removed deprecated `export const config` syntax
- NOTE: Billing portal is handled via `NEXT_PUBLIC_STRIPE_PORTAL_URL` (no dedicated portal API route).

**Verification**:
- ✅ `npm run typecheck` - Passes
- ✅ `npm run test` - All 21 tests pass
- ✅ `npm run build` - Builds successfully

---

## 📝 License

Private - All rights reserved.

