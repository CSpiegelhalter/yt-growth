## SEO audit notes

### Public, indexable pages
- `/`
- `/learn` and all learn articles
- `/contact`
- `/terms`
- `/privacy`

Expectations:
- Each has **title + description** metadata.
- Canonical URLs:
  - `/contact` → `${BRAND.url}/contact`
  - `/terms` → `${BRAND.url}/terms`
  - `/privacy` → `${BRAND.url}/privacy`
- Structured data:
  - `Organization` + `WebSite` + `SoftwareApplication` are injected globally in `app/layout.tsx`.
  - Learn pages include page/article schema where appropriate.

### Private pages (must be noindex)
These pages should not appear in search:
- `/dashboard`
- `/ideas`
- `/competitors` (and nested)
- `/saved-ideas`
- `/subscriber-insights`
- `/video/*`
- `/profile`
- `/admin/*`

### robots.txt
`app/robots.ts`:
- allows crawling public content
- disallows crawling private routes and `/api/*`

### sitemap.xml
`app/sitemap.ts` includes only public pages (no private app pages).

### Manual verification checklist
- Inspect rendered HTML:
  - exactly one `<h1>` on public pages
  - canonical present
  - OpenGraph/Twitter metadata present (inherited defaults + per-page overrides)
- Use Google Search Console URL inspection on `/` and `/learn`.


