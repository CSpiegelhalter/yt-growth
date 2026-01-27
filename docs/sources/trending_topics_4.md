# Notes: “Blow up a Sora AI YouTube channel in 7 days” (process + tools)

## Source
- Transcript-style notes provided by user (long-form, informal)
- Topic: How someone claims they grew a faceless “Sora AI” Shorts channel quickly and approached monetization

---

## High-level claim
- Started posting **Dec 13** and by **Dec 22** claims the channel “started blowing up” about a week in.
- Claims they’re “on track” to be monetized in the next couple days.
- Frames success as driven primarily by **niche selection + volume posting + repeatable production process**.

---

## Step 1: Choose a niche (most important + hardest)

### Method A: “Incognito method”
- Scroll YouTube in incognito to spot trends / niches.
- Problem cited: by the time niches are found, they’re already crowded.

### Method B: Use a niche-finding SaaS tool (example: “Algor/Algro”)
- Claims to have used a tool called **Algor** to find very new channels performing extremely well.
- Example channel found: “Rescue” (claims: ~11 videos, ~20M views in a week).
- Rationale:
  - Helps find **untapped niches earlier** than manual browsing.
  - Reduces risk of entering a niche late.

---

## “Good niche” requirements checklist (as described)

### Performance / demand signals
- Prefer channels whose **recent posts** consistently exceed **~100,000 views** (not mandatory, but “good to have”).

### Audience + language for RPM
- Prefer **English** content / English voiceover for higher RPM.
- Example audience stats claimed:
  - ~42% US, ~6% UK, ~4% Canada, ~2% Australia
- Goal: Higher-value geos → better monetization potential.

### Channel age signal (speed-to-viral indicator)
- Target niches where exemplar channels are **< 2 months old** (preferably **< 1 month**).
- Rationale: If a channel started recently and is already monetized, it suggests fast growth is possible.

### Production feasibility
- Videos should be:
  - **Easy to produce** (repeatable prompting/editing)
  - Preferably **faceless** (common for AI channels)

### Monetization feasibility (transformative input)
- Claim: AI videos must include **added human input** to be monetizable.
- Examples of “human input” mentioned:
  - **Voiceover**
  - **High editing**
  - (Both is better)

---

## Step 2: Set up the channel (pre-posting)

### Use an “aged” account
- Use an account **older than ~2 weeks**.
- “Warm it up”:
  - Scroll feed, watch long videos
  - Like and subscribe
- Purpose stated: make YouTube treat you like a real user.

### Basic branding
- Set:
  - Handle
  - Channel name
  - Profile picture
  - Description

### Settings configuration
- Set:
  - Country
  - Currency
  - Optional keywords
- Important: mark content **not made for kids** (claim: “made for kids” harms earnings)

---

## Step 3: Build a repeatable content factory (3–4 videos/day)

### Overview pipeline
1. Get niche/channel data (what’s working)
2. Generate ideas
3. Generate scripts
4. Generate clips (Sora)
5. Remove watermark (if needed)
6. Generate voiceover
7. Edit
8. Generate title/description
9. Post (high volume)

---

## Step 3A: Gather competitor data (manual or automated)

### Manual data capture (per top videos)
For each competitor video:
- Title
- Description
- Transcript (via transcript extractor site)
- Like count
- View count
- Comment count
- Video length/duration

Suggested approach:
- Create a “data” doc/tab
- Repeat for multiple top-performing videos
- Paste into Claude for analysis

### Transcript extraction tool mentioned
- “transcript extractor from video”
- Example site named: **youtube/transcript.io**
- Workflow:
  - Paste video link
  - Extract transcript
  - Copy/paste into data doc

### Automated scraping via “Algor/Algro scraper”
- Mentions a “creation tools” feature that can scrape a channel and export JSON.
- Suggested settings:
  - “custom 40 videos”
  - Export JSON
- Outcome:
  - Large dataset (e.g., “20 pages of data”) to paste into Claude
  - Includes channel-level stats like total views and avg views/video

---

## Step 3B: Use Claude to generate ideas + scripts

### Tool
- **Claude AI** (claimed best + free for this use case)

### Idea prompt (example)
- “Give me 20 viral YouTube shorts ideas.”

### Script prompt pattern (example)
- “For my idea: {IDEA}. Make me a viral script.”
- Refinement mentioned:
  - Ask for the script “in one big paragraph”

### Output usage
- Pick one idea from Claude’s list
- Generate a single-paragraph script
- Use script as the basis for clip prompts + voiceover

---

## Step 3C: Generate clips in Sora

### Access constraint mentioned
- If not in the US, may need a **VPN** to access Sora.
- Example: connect VPN to the United States, reload, then use Sora.

### Clip prompting approach
- Convert script into a visual prompt.
- Example prompt:
  - “firefighter saving golden retriever puppy’s life”
- Notes:
  - They admit better prompts yield better clips.
  - Suggest generating multiple videos at once to save time.

---

## Step 3D: Watermark removal (Sora → clean clip)
- Mentions an “Algro” tool: “Sora watermark remover”
- Workflow:
  - Post (or move out of drafts)
  - Copy share link
  - Paste link into watermark remover
  - Download “no blur” watermark-free output (as claimed)

---

## Step 3E: Voiceover generation (to be monetizable / transformative)

### Options mentioned
- **ElevenLabs** (free but limited credits)
- “Algro voice generation” (claims “unlimited 11 labs” access)

### Workflow
- Copy script from Claude
- Paste into voice generator
- Choose a voice (example: “Kenneth”)
- Generate voiceover
- Note: tool may take time but “usually works”

---

## Step 3F: Titles + descriptions
- Ask Claude:
  - “Make me a title and description.”
- Use generated options to post.

---

## Posting strategy (volume + iteration)

### Volume target
- Goal: **3 posts per day**
- Suggested ramp:
  - Day 1: 1 short
  - Day 2: 2 shorts
  - Day 3+: 3 shorts daily
- Claim: In this niche, “it’s all about volume”

### Avoid “shadowban”
- Mentions risk but no concrete rules given.

### Optimize via data
- Test:
  - Formats
  - Lengths
  - Topics/ideas
- “Double down on outliers”
  - Identify what performs best and repeat that style/topic.

---

## Scaling
- Hire editors and train them to help produce faster.
- Repeat the system across multiple channels.

---

## Tools/products referenced (index)
- YouTube (incognito browsing)
- Algor / Algro (niche discovery + scraping + watermark removal + voice gen)
- Claude AI (idea + script + title/description generation)
- Sora (video generation)
- VPN (US access for Sora)
- Transcript extractor (example: youtube/transcript.io)
- ElevenLabs (voiceover)

---

## Key heuristics (quick search)
- Niche signals: **100k+ recent views**, **English**, **channels < 2 months old**
- Monetization: **voiceover and/or heavy editing**
- Setup: **aged + warmed account**, **not made for kids**
- Production: **Claude → Sora → watermark remove → voiceover → edit → post**
- Growth: **3/day**, iterate, **double down on winners**

---

## Missing item
You said “Take this … And this one too” but only one source text was included in your message.
- If you paste the first text, I can format it into the same searchable Markdown structure.