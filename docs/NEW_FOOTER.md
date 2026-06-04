# New Footer Architecture

## 4-Column Footer

```
COMPANY          SOLUTIONS              RESOURCES          CONTACT
About            Revenue Recovery       Assessment         hello@zenithprosai.com
Case Studies     Treatment Acceptance   Growth Report      (555) 555-0000
Contact          Patient Retention      Blog               [City, State]
                 Recall Recovery        FAQs
```

## Bottom Row
```
Zenith Pros  |  Dental Revenue Recovery Platform
Privacy Policy  ·  Terms of Service  ·  © 2025 EduRadius LLC. All Rights Reserved.
```

## Column Definitions

### Column 1 — COMPANY
- About
- Case Studies
- Contact

### Column 2 — SOLUTIONS
- Revenue Recovery
- Treatment Acceptance
- Patient Retention
- Recall Recovery

### Column 3 — RESOURCES
- Assessment (links to #assessment)
- Growth Report (links to #sample-report)
- Blog (placeholder)
- FAQs (links to #faq)

### Column 4 — CONTACT
- Email address
- Phone number
- Location line

## Design Rules
- Background: `var(--brand-sidebar)` (dark)
- Text: `text-white/60`
- Headers: `text-white font-black text-xs uppercase tracking-widest`
- Links: hover `text-white`
- Divider line above footer: `border-white/10`
- Bottom row: centered, smaller text, `text-white/40`

## Removed from Footer
- All platform architecture references
- "A product and service of" → simplified to copyright line
- No technical product names
- No internal system links
