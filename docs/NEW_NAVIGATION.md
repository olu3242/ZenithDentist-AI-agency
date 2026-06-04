# New Navigation Architecture

## Desktop Navigation

```
[ZENITH LOGO]  Assessment · Solutions · Results · About · Case Studies · Contact  [Start Free Assessment →]
```

### Nav Items
| Label | Anchor/Path | Notes |
|-------|------------|-------|
| Assessment | #assessment | Primary conversion destination |
| Solutions | #solutions | Revenue leak + outcomes section |
| Results | #results | Story gallery + outcomes |
| About | #about | (optional static section or /about page) |
| Case Studies | #case-studies | Social proof section |
| Contact | #contact | Footer / contact section |

### CTA Button
- Label: "Start Free Assessment"
- Style: bg-teal, text-sidebar, font-black
- Height: h-10

### Behavior
- Sticky (fixed top)
- Backdrop blur on scroll
- Active state: text-white (vs text-white/62 default)
- Mobile: hamburger → slide-down menu

---

## Mobile Navigation

### Collapsed State
```
[ZENITH LOGO]                    [≡]
```

### Expanded State
```
[ZENITH LOGO]                    [✕]
Assessment
Solutions
Results
About
Case Studies
Contact
[Start Free Assessment]   ← full-width CTA
```

### Mobile Behavior
- Full-width dropdown
- Touch-friendly (min 48px tap targets)
- Assessment CTA always visible at bottom of mobile menu
- Closes on link tap

---

## Removed from Navigation
- Platform (engineering-centric)
- Screens (internal UI term)
- Intelligence (exposes AI architecture)
- Executive Dashboard (internal operational)
- PMS Ops (developer term)
- Route Probe button (developer tool)
- Login/Signup/Dashboard (authenticated — move to /login directly if needed)
