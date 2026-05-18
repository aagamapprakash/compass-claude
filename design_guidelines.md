# Design Guidelines: Analog Travel Journal

## Design Approach
**Refined Neobrutalism / Analog Print**: The app feels like a well-worn travel journal — parchment backgrounds, visible ink-black borders, hard offset shadows (no blur), and editorial serif typography. Inspired by analog maps, field ledgers, and letterpress printing. The aesthetic is understated and legible, not flashy or neon.

Key principles:
- Ink on parchment, not glow on dark glass
- Borders are **visible** and structural, not decorative ghost lines
- Hard shadows replace soft blur — offset, not diffuse
- Near-zero border radius (sharp corners everywhere)
- Monospace for all metadata, labels, tags, and UI chrome
- Serif (Newsreader) for all editorial content: headings, body copy, titles

---

## Color System

| Token | Hex | Usage |
|---|---|---|
| **Parchment** (background) | `#fbf9f4` | Page background, warm off-white |
| **Ink** (foreground) | `#1b1c19` | All body text, borders, shadows |
| **Card** | `#f5f2eb` | Card surfaces (slightly warmer than bg) |
| **Sidebar** | `#1f2219` | Dark sidebar, warm ink tone |
| **Sage** (primary) | `#425650` | Navigation, primary buttons, badges |
| **Sage Light** (accent) | `#5a6e68` | Hover states, secondary accents |
| **Maroon** | `#7A1F2D` | Past status badge, error states |
| **Gold** | `#D4A259` | Active/current status badge |
| **Cream** | `#FAF7F2` | Secondary surfaces |

Tailwind custom classes: `text-compass-navy` (sage), `text-compass-maroon`, `text-compass-gold`, `text-compass-ink`, `bg-compass-parchment`.

---

## Typography

**Fonts in use:**
- **Newsreader** — all headings, body text, editorial copy (Google Fonts, ital,opsz,wght axes)
- **JetBrains Mono** — all labels, metadata, tags, button text, timestamps, UI chrome
- **Inter** — fallback only (not used for primary type)

**Key rule:** `font-serif` = Newsreader (editorial). `font-mono` = JetBrains Mono (utility/label).

**Hierarchy:**
| Role | Classes |
|---|---|
| Hero title | `text-5xl md:text-6xl font-serif font-semibold italic text-white` |
| Section header | `text-2xl md:text-3xl font-serif font-semibold text-foreground` |
| Card title | `text-xl font-serif font-semibold` |
| Body copy | `text-base font-serif text-foreground` |
| Section label | `font-mono text-xs uppercase tracking-widest text-primary` |
| Meta / date | `font-mono text-xs text-muted-foreground` |
| Tags / badges | `font-mono text-xs uppercase tracking-wider` |
| Button text | `font-mono text-xs uppercase tracking-widest` |
| Ledger date | `font-mono text-xs tracking-wider` — format: `DD.MMM.YY` (e.g. `24.OCT.23`) |

---

## Shadows & Borders

**Hard offset shadow (no blur):**
```css
.hard-shadow       { box-shadow: 3px 3px 0 0 #1b1c19; }
.hard-shadow-sm    { box-shadow: 2px 2px 0 0 #1b1c19; }
.hard-shadow-active:active {
  transform: translate(2px, 2px);
  box-shadow: 1px 1px 0 0 #1b1c19;
}
```
Tailwind: `shadow-hard`, `shadow-hard-sm`.

**Border convention:**
- Cards: `border-2 border-foreground` (ink, 2px)
- Image dividers within cards: `border-b-2 border-foreground`
- Tags/chips/badges: `border border-foreground/40`
- Dividers / footer rows: `border-t-2 border-foreground/20`
- Sidebar sections: `border-t border-white/10`

**No soft box-shadows on interactive cards.** Use hard shadows only.

---

## Border Radius

Near-zero everywhere:
```ts
borderRadius: {
  sm: "0.0625rem",
  md: "0.125rem",
  lg: "0.25rem",
}
```
Default `--radius: 0.125rem`. Use `rounded-none` for cards, badges, buttons. The overall feel is sharp and printed.

---

## Layout

- **Page container:** `max-w-7xl mx-auto px-6 md:px-12`
- **Section spacing:** `py-16 md:py-24`
- **Card padding:** `p-5`
- **Grid:** CSS columns masonry — `columns-1 sm:columns-2 lg:columns-3 xl:columns-4`
- **Sidebar:** Left fixed sidebar (animated expand/collapse), dark ink background (`bg-sidebar`)

---

## Component Patterns

### Sidebar
- Background: `bg-sidebar` (`#1f2219` warm ink dark)
- Logo: flat sage square `bg-primary border-2 border-white/20` containing a compass icon
- Logo wordmark: `font-serif italic font-semibold text-xl text-white/90`
- Nav links: `font-mono text-xs uppercase tracking-widest text-white/80`
- Active link: `border-l-2 border-white/40 bg-white/10`
- Hover: `hover:bg-white/8 hover:text-white/90`
- User avatar at bottom: `border border-white/30`, fallback `bg-primary font-mono text-xs`
- Logout/Sign In: `font-mono text-xs uppercase tracking-widest`

### Trip Card (Analog Ledger Card)
```
┌──────────────────────────────────┐  ← border-2 border-foreground hard-shadow
│  [image: grayscale-20% at rest]  │  ← border-b-2 border-foreground
│  [transport icon] [DD.MMM.YY]    │  ← absolute, bg-card border border-foreground
├──────────────────────────────────┤
│  [CITY]  [STATUS]  [PARTY SIZE]  │  ← mono chips, border border-foreground/40
│  Full Destination Name           │  ← font-serif text-xl font-semibold
│  📅 DD.MMM.YY — DD.MMM.YY       │  ← font-mono text-xs muted
│  Description excerpt…            │  ← font-serif text-sm muted, line-clamp-3
├──────────────────────────────────┤  ← border-t-2 border-foreground/20 bg-secondary/50
│  ♥ 12   📍 username              │  ← font-mono text-xs
│                       Read Entry →│  ← font-mono text-xs border-b border-foreground/40
└──────────────────────────────────┘
```
- Hover: `hover:-translate-y-0.5 transition-transform duration-200`
- Image: `grayscale-[20%] group-hover:grayscale-0 transition-all duration-500`

### Status Badges
```tsx
// rounded-none, font-mono, uppercase
past:     bg-compass-maroon text-white
current:  bg-compass-gold text-compass-navy font-semibold
upcoming: bg-compass-navy text-white   // navy here = sage (#425650)
```
All badges: `rounded-none px-2 py-0.5 font-mono text-xs uppercase tracking-wider border border-current/30`

### Buttons
- **Primary**: `bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest border-2 border-foreground hard-shadow hard-shadow-active`
- **Secondary / Ghost**: `border border-foreground/40 font-mono text-xs uppercase tracking-wider hover:bg-foreground/5`
- **On-image**: `bg-white/20 border border-white/30 font-mono text-xs uppercase tracking-wider backdrop-blur-sm`
- No pill shapes (`rounded-full`). All buttons are `rounded-none` or `rounded-sm`.

### Forms
- Inputs: `border-2 border-foreground/40 focus:border-foreground rounded-sm font-serif text-base`
- Labels: `font-mono text-xs uppercase tracking-wider text-foreground/70 mb-2`
- Submit: primary button style above

### Tags / Chips
```tsx
<span className="border border-foreground/40 px-2 py-0.5 font-mono text-xs uppercase tracking-wider">
  {value}
</span>
```

---

## Hero Section

- Background: full-width travel photo
- Overlay: `hero-overlay` class — linear gradient top→bottom: `rgba(27,28,25,0.15)` → `rgba(27,28,25,0.60)` (lighter than old navy gradient)
- Badge above headline: `bg-white/20 border border-white/30 font-mono text-xs uppercase tracking-wider backdrop-blur-sm`
- Headline: `text-5xl md:text-6xl font-serif font-semibold italic text-white`
- Sub-copy: `font-serif text-lg md:text-xl text-white/85`

---

## Images

- Trip card images: slight desaturation at rest (`grayscale-[20%]`), full color on hover (`group-hover:grayscale-0`)
- No aggressive overlays or vignettes on cards
- Hero: use `.hero-overlay` for text legibility over photography
- Image borders within cards: `border-b-2 border-foreground` (structural, not decorative)

---

## Animations

- Card hover lift: `hover:-translate-y-0.5 transition-transform duration-200` (subtle — 2px)
- Image desaturation release: `transition-all duration-500`
- Hard shadow press: `.hard-shadow-active:active { transform: translate(2px,2px); }` (tactile ink-stamp feel)
- No blur-in, no fade-slide stagger, no neon glow pulses

---

## Accessibility

- All text on photography uses `.hero-overlay` or `bg-card` chips — never bare text over image
- Focus rings: `ring-2 ring-foreground/40` (ink tone, not gold neon)
- Semantic HTML with landmark regions
- Alt text on images is descriptive

---

## Responsive Breakpoints

- **Mobile**: Single column, sidebar collapses to icon-only strip
- **Tablet** (md: 768px): 2-column cards, sidebar expands on hover
- **Desktop** (lg: 1024px): 3-column cards, sidebar always visible
- **Wide** (xl: 1280px): 4-column cards, max content width `max-w-7xl`

---

## Icons

**Lucide React** (already installed). Outline style, `h-4 w-4` or `h-5 w-5`. Color via `text-*` class — no gold fills on nav icons. Use `text-white/80` inside the dark sidebar.
