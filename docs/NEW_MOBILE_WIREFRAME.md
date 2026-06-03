# New Mobile Wireframe

## Design Principles
- Single-thumb navigation
- Sticky CTA (assessment) always reachable
- Fast scroll — each section fits one screen
- Touch-friendly: 48px minimum tap targets
- WCAG AA: 4.5:1 contrast minimum

---

## Mobile Layout (375px viewport)

```
┌─────────────────────────────┐
│ [Z] Zenith        [≡] Menu  │  ← sticky header h-14
└─────────────────────────────┘

┌─────────────────────────────┐
│                             │
│  Recover Lost Revenue.      │  ← H1, 3xl font-black
│  Fill More Chairs.          │
│  Grow Predictably.          │
│                             │
│  Zenith helps dental...     │  ← body, text-sm
│                             │
│  [Start Free Assessment →]  │  ← full-width CTA
│  [See How It Works]         │  ← full-width secondary
│                             │
│  ✓ 3-Min  ✓ Personal  ✓ Free│  ← trust bar
└─────────────────────────────┘

┌─────────────────────────────┐
│ Works With Your Software    │
│  Open Dental  Dentrix  ...  │  ← 2-col grid
└─────────────────────────────┘

┌─────────────────────────────┐
│ FREE ASSESSMENT             │
│ Discover Hidden Revenue     │
│                             │
│  [Assessment Form — full    │  ← RoiFunnelForm
│   width, sliders stack      │    responsive as-is
│   vertically]               │
│                             │
└─────────────────────────────┘

┌─────────────────────────────┐
│ REVENUE LEAKS               │
│ Your Practice Is Losing...  │
│                             │
│ [Card 1: Missed Recalls]    │  ← 1-col cards
│ [Card 2: Unscheduled...]    │
│ [Card 3: Inactive Patients] │
│ [Card 4: Unanswered Calls]  │
│ [Card 5: No-Show Leakage]   │
│ [Card 6: Poor Follow-Up]    │
│ [Card 7: Review Gaps]       │
└─────────────────────────────┘

┌─────────────────────────────┐
│ MEET LIZ                   │
│ Your Revenue Recovery...    │
│                             │
│ ┌───────────────────────┐   │
│ │ Opportunity Identified │   │  ← LIZ card 1
│ │ 127 overdue patients   │   │
│ │ $18,400 opportunity    │   │
│ └───────────────────────┘   │
│ ┌───────────────────────┐   │
│ │ Opportunity Identified │   │  ← LIZ card 2
│ │ 42 unscheduled plans   │   │
│ │ $31,200 opportunity    │   │
│ └───────────────────────┘   │
└─────────────────────────────┘

┌─────────────────────────────┐
│ HOW IT WORKS                │
│                             │
│ ┌───────────────────────┐   │
│ │ [Image: Empty chair]  │   │  ← Story slide (vertical)
│ │ Missed Opportunities  │   │
│ │ Revenue disappears... │   │
│ └───────────────────────┘   │
│ ┌───────────────────────┐   │
│ │ [Image: Patient]      │   │
│ │ Patients Fall Through │   │
│ └───────────────────────┘   │
│ ... (3 more slides)         │
│                             │
│ ○ ○ ● ○ ○  ← dot indicators│
└─────────────────────────────┘

┌─────────────────────────────┐
│ GETTING STARTED             │
│ How Zenith Gets You Results │
│                             │
│ 01 Baseline Diagnostics     │  ← vertical numbered list
│ 02 Organization Setup       │
│ 03 PMS Connection           │
│ ...                         │
│ 09 Optimization Cycle       │
└─────────────────────────────┘

┌─────────────────────────────┐
│ RESULTS                     │
│ What Practices Gain         │
│                             │
│ [Revenue Recovery]  [Recall]│  ← 2-col grid
│ [Treatment Accept]  [Retain]│
│ [Reviews] [Membership]      │
│ [Efficiency] [Intelligence] │
└─────────────────────────────┘

┌─────────────────────────────┐
│ PRACTICE GROWTH REPORT      │
│ See What Your Assessment    │
│ Reveals                     │
│                             │
│  Score: 78/100              │
│  Opportunity: $12K–$27K/mo  │
│                             │
│  [Get Your Free Report →]   │
└─────────────────────────────┘

┌─────────────────────────────┐
│ FAQ                         │
│                             │
│ [Q1 accordion]              │
│ [Q2 accordion]              │
│ [Q3 accordion]              │
└─────────────────────────────┘

┌─────────────────────────────┐  ← dark bg
│                             │
│  Ready To Discover          │
│  What's Being Missed?       │
│                             │
│  [Start Free Assessment →]  │
│  [Book Strategy Session]    │
└─────────────────────────────┘

┌─────────────────────────────┐
│ COMPANY  SOLUTIONS          │  ← 2-col footer on mobile
│ About    Rev Recovery       │
│ Cases    Treatment Accept   │
│ Contact  Patient Retention  │
│          Recall Recovery    │
│                             │
│ RESOURCES  CONTACT          │
│ Assessment  email           │
│ Report      phone           │
│ FAQs        location        │
│                             │
│ © 2025 EduRadius LLC        │
└─────────────────────────────┘

┌─────────────────────────────┐
│ [Recovery $14K] [78/100]    │  ← sticky mobile bottom bar
│        [Start Assessment]   │    (shows after scroll past hero)
└─────────────────────────────┘
```

## Sticky Bottom Bar (mobile only, post-scroll)
- Appears after user scrolls past hero
- Shows: recovery estimate (from assessment if started) + CTA
- Height: 64px
- Background: bg-ink
- CTA: full remaining width
