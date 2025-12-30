## SEO audit notes

### Public, indexable pages
- `/` (landing)
- `/learn` (hub)
- `/learn/youtube-channel-audit`
- `/learn/youtube-retention-analysis`
- `/learn/how-to-get-more-subscribers`
- `/learn/youtube-competitor-analysis`
- `/learn/youtube-video-ideas`
- `/contact`
- `/terms`
- `/privacy`

### Metadata expectations
Each public page has:
- **title + description** via Next.js `metadata` export.
- **canonical URL** pointing to full BRAND.url path.
- **OpenGraph** title, description, URL, type.

### Structured data
- `Organization` + `WebSite` + `SoftwareApplication` JSON-LD in `app/layout.tsx` (global).
- Learn article pages include `Article` + `BreadcrumbList` JSON-LD via `lib/seo.ts`.

### Private pages (must be noindex)
These pages have `robots: { index: false, follow: false }`:
- `/dashboard`
- `/ideas`
- `/competitors` (and nested `/competitors/video/[videoId]`)
- `/saved-ideas`
- `/subscriber-insights`
- `/video/*`
- `/profile`
- `/admin/*`
- `/auth/login`
- `/auth/signup`

### robots.txt
`app/robots.ts`:
- Allows: `/`, `/learn/`, `/contact`, `/terms`, `/privacy`
- Disallows: `/api/`, `/auth/`, `/dashboard`, `/profile`, `/ideas`, `/competitors`, `/saved-ideas`, `/subscriber-insights`, `/video/`, `/admin/`

### sitemap.xml
`app/sitemap.ts` includes only public pages with correct priorities:
- Landing: 1.0
- Learn articles: 0.9
- Learn hub: 0.8
- Contact: 0.5
- Legal (terms/privacy): 0.3

### Manual verification checklist
- Inspect rendered HTML:
  - Exactly one `<h1>` on public pages
  - Canonical present
  - OpenGraph/Twitter metadata present
  - JSON-LD scripts render correctly
- Use Google Search Console URL inspection on `/` and `/learn`.


