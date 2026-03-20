# Data Model: Landing Page Redesign

No data model changes required. This feature is a presentation-only refactor of the landing page.

## Existing Entities (Read-Only Reference)

- **FEATURES** (`lib/shared/brand.ts`): Object containing 5 feature pillar definitions (title, description, keywords). Used to populate feature card content.
- **HOME_CONTENT** (`lib/content/home.ts`): Object containing SEO section content, FAQ items, "Who It's For", and "Use Cases" lists.
- **LEARN_ARTICLES** (`app/(marketing)/learn/articles.ts`): Article registry used to populate guide cards.

No new entities, database tables, or data schemas are introduced.
