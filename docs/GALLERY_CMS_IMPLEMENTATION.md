# Gallery CMS Implementation

## Status: INFRASTRUCTURE COMPLETE ✅ — DB-backed, seeded with current content

---

## Database Tables

**Migration**: `supabase/migrations/20260626000000_social_proof_gallery_cms.sql`

### gallery_categories

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| slug | text | Unique identifier (e.g. "problem", "liz-insight") |
| label | text | Display name |
| sort_order | int | Ordering |

**Seeded categories**:

| slug | label | sort_order |
|------|-------|------------|
| problem | The Problem | 1 |
| opportunity | The Opportunity | 2 |
| liz-insight | LIZ Insight | 3 |
| action | The Action | 4 |
| result | The Result | 5 |

### gallery_items

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| category_id | uuid | FK → gallery_categories |
| title | text | Card headline |
| body | text | Main copy |
| stat | text | Highlighted metric (optional) |
| stat_label | text | Metric description (optional) |
| image_url | text | Optional image |
| sort_order | int | Display order |
| is_published | bool | Public visibility gate |

**Seeded items**: The 5 existing hardcoded slides from `pros-landing.tsx` are now persisted in the database as the canonical source.

---

## Data Layer

**File**: `lib/data/social-proof.ts`

```typescript
getFeaturedGalleryItems()      // Returns all published items
getGalleryItemsByCategory(slug) // Returns published items for one category
```

---

## Current Architecture

The `pros-landing.tsx` Story Gallery section currently renders from hardcoded slide data in the component. The DB tables serve as the CMS source when the component is wired to fetch from `getFeaturedGalleryItems()`.

### Migration Path to DB-Driven Gallery

1. In `pros-landing.tsx`, replace hardcoded `slides` array with prop from server
2. In `app/page.tsx`, add `const galleryItems = await getFeaturedGalleryItems()`
3. Pass `galleryItems` prop to `ProsLanding`
4. Replace `slides.map(...)` with `galleryItems.map(...)`

This is a non-breaking change — hardcoded slides are already seeded to DB with same content.

---

## Admin Management

Pending Sprint 3: Admin UI at `/admin/gallery` for:
- Add/edit/delete gallery items
- Toggle published status
- Reorder items
- Manage categories

Until admin UI is built, manage via Supabase dashboard directly.
