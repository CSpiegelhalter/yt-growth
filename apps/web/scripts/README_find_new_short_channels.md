# Find New Short Channels

A script to discover new YouTube channels that have achieved breakout success with Shorts.

## What It Does

This script finds YouTube channels that:
- Were created within the last N days (default: 15)
- Have fewer than M total public videos (default: 30)
- Have posted Shorts (≤60 seconds) within the last N days
- Those Shorts have at least X views (default: 300,000)

This helps identify emerging creators who are gaining traction quickly with short-form content.

## Prerequisites

### Get a YouTube Data API Key

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select an existing one)
3. Enable the **YouTube Data API v3**:
   - Go to "APIs & Services" → "Library"
   - Search for "YouTube Data API v3"
   - Click "Enable"
4. Create credentials:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "API Key"
   - Copy your API key
5. (Optional) Restrict the API key:
   - Click on the key to edit it
   - Under "API restrictions", select "Restrict key"
   - Choose "YouTube Data API v3"

### API Quota

The YouTube Data API has quota limits (default: 10,000 units/day).

- `search.list`: 100 units per call
- `videos.list`: 1 unit per call (batched up to 50 IDs)
- `channels.list`: 1 unit per call (batched up to 50 IDs)

A typical run with 25 queries uses ~2,600 units:
- 25 searches × 100 = 2,500 units
- ~50 video batches × 1 = ~50 units
- ~20 channel batches × 1 = ~20 units

## Usage

```bash
YT_API_KEY=your_api_key bun run scripts/find_new_short_channels.ts [options]
```

### Options

| Option | Default | Description |
|--------|---------|-------------|
| `--days=N` | 15 | Channel age and video recency filter (days) |
| `--maxChannelVideos=N` | 30 | Max videos a qualifying channel can have |
| `--minViews=N` | 300000 | Minimum views for a Short to qualify |
| `--region=XX` | US | YouTube region code (e.g., US, GB, CA) |
| `--pagesPerQuery=N` | 1 | Pages of search results per query (1-10) |
| `--maxQueries=N` | 25 | Max search queries to run |
| `--q="keyword"` | (none) | Custom search query (can be repeated) |
| `--useTrends=bool` | true | Use Google Trends for queries |
| `--trendsGeo=XX` | US | Google Trends geo code |
| `--out=filename` | new_short_channels.csv | Output CSV filename |
| `--selfTest` | - | Run unit tests |
| `--help` | - | Show help |

## Examples

### Basic Usage (Trending Keywords)

Uses Google Trends to find relevant search terms:

```bash
YT_API_KEY=xxx bun run scripts/find_new_short_channels.ts
```

### Custom Search Queries

Search for specific niches without using trends:

```bash
YT_API_KEY=xxx bun run scripts/find_new_short_channels.ts \
  --useTrends=false \
  --q="cooking shorts" \
  --q="recipe hack" \
  --q="kitchen tips"
```

### More Relaxed Filters

Find channels up to 30 days old with at least 100K views:

```bash
YT_API_KEY=xxx bun run scripts/find_new_short_channels.ts \
  --days=30 \
  --minViews=100000 \
  --maxChannelVideos=50
```

### Different Region

Search for UK creators:

```bash
YT_API_KEY=xxx bun run scripts/find_new_short_channels.ts \
  --region=GB \
  --trendsGeo=GB
```

### More Search Results

Fetch more pages per query (uses more quota):

```bash
YT_API_KEY=xxx bun run scripts/find_new_short_channels.ts \
  --pagesPerQuery=3 \
  --maxQueries=10
```

## Output

### CSV File

The script generates a CSV file with these columns:

| Column | Description |
|--------|-------------|
| channelId | YouTube channel ID |
| channelTitle | Channel name |
| channelUrl | Direct link to channel |
| channelCreatedAt | When the channel was created |
| channelAgeDays | Age of channel in days |
| channelVideoCount | Total videos on channel |
| breakoutVideoId | ID of the qualifying Short |
| breakoutVideoUrl | Direct link to the Short |
| breakoutTitle | Title of the Short |
| breakoutPublishedAt | When the Short was published |
| breakoutViews | View count on the Short |
| queryMatched | Search query that found this video |

### Console Summary

The script also prints a summary:

```
=== Summary ===
Total queries: 25
Videos scanned: 1247
Shorts qualified: 89
Channels qualified: 12
CSV path: new_short_channels.csv
```

## Running Tests

The script includes built-in unit tests:

```bash
bun run scripts/find_new_short_channels.ts --selfTest
```

## Troubleshooting

### "YT_API_KEY environment variable is required"

Make sure you're passing the API key:

```bash
YT_API_KEY=your_key_here bun run scripts/find_new_short_channels.ts
```

### "quotaExceeded" Error

You've hit the daily quota limit. Options:
- Wait until quota resets (midnight Pacific Time)
- Reduce `--maxQueries` or `--pagesPerQuery`
- Request a quota increase in Google Cloud Console

### No Results Found

Try:
- Increasing `--days` (e.g., 30)
- Lowering `--minViews` (e.g., 100000)
- Using different `--q` keywords
- Trying a different `--region`

### Network Errors

The script automatically retries on 429 (rate limit) and 5xx errors with exponential backoff. If errors persist, check your internet connection.

## How It Works

1. **Get search queries**: Either from CLI (`--q`) or Google Trends RSS
2. **Search videos**: For each query, search YouTube for recent short-duration videos sorted by view count
3. **Filter videos**: Fetch video details and filter to actual Shorts (≤60s) with minimum views
4. **Filter channels**: Fetch channel details and filter by age and video count
5. **Output**: Generate CSV sorted by views, print summary

The script is quota-conscious:
- Dedupes video IDs across queries
- Batches API calls (up to 50 IDs per request)
- Uses coarse `videoDuration=short` filter first, then precise duration check
