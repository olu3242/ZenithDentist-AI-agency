# New Gallery Architecture

## Concept

Replace the technical gallery (schema mapping, dispatch logs, hotspot telemetry) with an outcome-focused visual story. Style inspiration: Apple Product Storytelling, Tesla Product Reveal, Linear Product Story.

## Format

Horizontal scroll on desktop, vertical stack on mobile. 5 slides. Each slide: full-bleed visual, bold headline, short caption, outcome focus only.

---

## Slides

### Slide 1 — Missed Opportunities
**Image:** Empty dental chair, clinical light on
**Alt:** Empty dental operatory
**Headline:** Missed Opportunities Add Up
**Caption:** Revenue opportunities disappear from your practice every day — silently.
**Source:** `https://images.unsplash.com/photo-1606811971618-4486d14f3f99` (existing hero image)

### Slide 2 — Patients Fall Through
**Image:** Patient scheduling or consultation moment
**Alt:** Dental patient consultation
**Headline:** Patients Fall Through The Cracks
**Caption:** Inactive patients often represent the largest hidden growth opportunity.
**Source:** `https://images.unsplash.com/photo-1588776814546-1ffbb172d8e5`

### Slide 3 — LIZ Insight
**Component:** LIZ insight card (inline component, no backend data)
**Headline:** LIZ Identifies What Matters
**Caption:** See exactly where your revenue opportunities exist — prioritized by impact.

### Slide 4 — Action Creates Growth
**Image:** Patient returning to dental chair, or positive clinical moment
**Alt:** Patient engagement in dental practice
**Headline:** Action Creates Growth
**Caption:** Consistent, intelligent follow-up drives better outcomes for patients and practices.
**Source:** `https://images.unsplash.com/photo-1629909613654-28e377c37b09` (existing gallery image)

### Slide 5 — Dashboard / Results
**Component:** Practice Growth Score card (static example: 78/100, $14,200–$27,000)
**Headline:** Predictable, Measurable Growth
**Caption:** Know where to focus next. Every week, every month.

---

## Technical Spec

```tsx
// Horizontal scroll container
<div className="flex gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4">
  {slides.map(slide => (
    <div key={slide.id} className="min-w-[340px] snap-start md:min-w-[480px]">
      {/* slide content */}
    </div>
  ))}
</div>
```

## Slide Card Design

- Border: `border border-white/10`
- Background: `bg-[color:var(--brand-sidebar-elevated)]`
- Rounded: `rounded-xl`
- Min height: `min-h-[360px]`
- Image: `object-cover`, `opacity-80`, gradient overlay bottom
- Headline: `text-2xl font-black text-white`
- Caption: `text-white/70 text-sm leading-6`

## Rules

- No architecture diagrams
- No schema mapping
- No developer language
- No "Sandbox", "Live", "Demo" mode switchers
- No "Dispatch", "Writeback", "Adapter" terms
- No internal status labels (DISPATCHED, COMPLETED, etc.)
- Outcomes only: revenue, patients, growth, intelligence
