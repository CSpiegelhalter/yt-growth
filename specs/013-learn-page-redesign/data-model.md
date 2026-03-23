# Data Model: Learn Page Redesign

**Branch**: `013-learn-page-redesign` | **Date**: 2026-03-20

## Overview

This feature involves no database changes, no new entities, and no schema modifications. All data is read-only from existing content configuration files.

## Existing Data Sources (Unchanged)

### LEARN_INDEX_CONTENT
- **Location**: `lib/content/learn-index.ts`
- **Usage**: Provides all text content for the `/learn` page (hero, intro, highlights, start-here guides, categories, FAQ, CTA)
- **Status**: No changes needed — content is preserved verbatim

### learnArticles
- **Location**: `app/(marketing)/learn/articles.ts`
- **Usage**: Array of article metadata (slug, title, description, category, readingTime, ctaLabel) rendered in the articles grid
- **Status**: No changes needed

### BRAND / FEATURES
- **Location**: `lib/shared/brand.ts`
- **Usage**: Brand name, URL for Landing page hero content
- **Status**: No changes needed

## Component Props (New Interfaces)

### MarketingHeroBand Props
```
MarketingHeroBandProps:
  - children: ReactNode          # Text content for the left column
  - iconAlt?: string             # Alt text for the landing icon (default: brand-appropriate alt)
  - className?: string           # Optional additional class for the outer wrapper
```

This is the only new interface introduced. It is intentionally minimal — the component renders the gradient band, texture overlay, and icon, while `children` handles all content variation between pages.
