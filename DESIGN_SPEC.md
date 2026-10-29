# Findora — Design Specification

## Visual Identity

### Product Personality
Editorial utility platform for a university lost-and-found system. Trustworthy, calm, efficient, and human-centered. Not a generic SaaS template.

### Target Audience
- University students who have lost belongings
- People who have found belongings
- Administrators who review reports and claims

### Color Palette

| Role | Token | Hex | Usage |
|------|-------|-----|-------|
| Background | `--findora-bg` | `#ffffff` | Page background |
| Text primary | `--findora-text` | `#0f172a` | Headings, body text |
| Text secondary | `--findora-text-secondary` | `#475569` | Supporting text, captions |
| Accent | `--findora-accent` | `#d97706` | Primary buttons, links, focal points |
| Accent hover | `--findora-accent-hover` | `#b45309` | Button hover states |
| Border | `--findora-border` | `#e2e8f0` | Card borders, dividers |
| Shadow | `--findora-shadow` | `0 1px 3px 0 rgb(0 0 0 / 0.1)` | Subtle card elevation |

Status colors:
- Lost: red (`#fca5a5` border, `#7f1d1d` text, `#fef2f2` bg)
- Found: emerald (`#bbf7d0` border, `#065f46` text, `#ecfdf5` bg)
- Matched: amber (`#fde68a` border, `#92400e` text, `#fffbeb` bg)
- Claimed: blue (`#bfdbfe` border, `#1e3a8a` text, `#eff6ff` bg)
- Recovered: emerald (same as Found)

### Typography

| Element | Size | Line Height | Weight | Letter Spacing |
|---------|------|-------------|--------|----------------|
| h1 | 2.25rem (36px) | 1.1 | 600 | -0.02em |
| h2 | 1.875rem (30px) | 1.2 | 600 | -0.02em |
| h3 | 1.5rem (24px) | 1.25 | 600 | -0.02em |
| Body | 1rem (16px) | 1.5 | 400 | normal |
| Small | 0.875rem (14px) | 1.4 | 400 | normal |

Font family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif

### Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| Section padding | py-16 px-4 | Major section vertical padding |
| Container max-width | max-w-7xl | Content width cap |
| Component gap | gap-4, gap-6 | Internal component spacing |
| Border radius | rounded-md (6px), rounded-xl (12px) | Buttons, cards |

### Layout Grid

- Content width: max 1280px (max-w-7xl)
- Margins: auto-centered
- Breakpoints: sm (640px), md (768px), lg (1024px)
- Mobile-first: stack vertically on small screens, side-by-side on large

### Component Conventions

**Buttons:**
- `.btn` — base: inline-flex, rounded-md, px-4, py-2, text-sm, font-medium, transition-colors, focus:ring-2
- `.btn-primary` — bg-findora-accent, text-white, shadow-sm
- `.btn-outline` — bg-white, border-findora-border, text-findora-text

**Inputs:**
- `.input` — block, w-full, rounded-md, border-findora-border, px-3, py-2, text-sm, shadow-sm, focus:border-findora-accent

**Cards:**
- `.card` — rounded-xl, border-findora-border, bg-white, shadow-sm, overflow-hidden

**Badges:**
- `.badge` — inline-flex, rounded-full, border, px-2.5, py-0.5, text-xs, font-semibold
- Status variants: .badge-lost, .badge-found, .badge-matched, .badge-claimed, .badge-recovered

### Animation Principles

- Only purposeful animation (mobile nav open/close, item hover states)
- Respect `prefers-reduced-motion`
- No scroll-jacking, no floating decorative blobs
- Transitions: 0.2s ease for color, 0.3s ease for transform/opacity

### Responsive Breakpoints

| Breakpoint | Prefix | Behavior |
|------------|--------|----------|
| Mobile | base | Single column, stacked, smaller text |
| sm | sm: | 640px+, minor adjustments |
| md | md: | 768px+, two-column layouts begin |
| lg | lg: | 1024px+, full desktop layout |

### Interactive States

| State | Treatment |
|-------|-----------|
| Focus | Visible 2px ring with offset-2 |
| Hover | Color shift to accent-hover, subtle shadow |
| Active | Slight scale or pressed appearance |
| Disabled | 50% opacity, cursor-not-allowed |
| Success | Emerald/green styling |
| Warning | Amber/orange styling |
| Error | Red styling |

## What to Avoid

- Generic AI-generated SaaS templates
- Purple and blue gradients
- Glassmorphism without clear reason
- Random floating decorative blobs
- Repeated grids of identical cards
- Excessive rounded containers
- Excessive shadows
- Emoji as interface icons
- Generic stock photography
- Fake testimonials or invented statistics
- Excessive animations