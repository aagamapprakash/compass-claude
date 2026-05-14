# Design Guidelines: Editorial Travel Photography Social App

## Design Approach
**Reference-Based**: Pinterest-inspired masonry layouts with editorial magazine aesthetics. Drawing from Condé Nast Traveler's visual storytelling, Pinterest's discovery patterns, and VSCO's premium photography curation. Cinematic, aspirational, not generic.

## Color System
- **Primary Navy**: #00357A (navigation, headers, primary buttons)
- **White**: #FFFFFF (backgrounds, cards, text on dark)
- **Maroon Accent**: #7A1F2D (status badges, secondary CTAs, highlights)
- **Gold Accent**: #D4A259 (premium features, icons, decorative elements)
- **Neutrals**: Gray-50 to Gray-900 for subtle text hierarchy

## Typography System
**Fonts**: 
- **Serif (Headlines)**: Playfair Display - editorial, elegant, aspirational
- **Sans-Serif (Body)**: Inter - clean, modern, readable

**Hierarchy**:
- **Hero Titles**: text-5xl md:text-7xl font-serif font-bold (Playfair)
- **Section Headers**: text-3xl md:text-4xl font-serif font-semibold
- **Card Titles**: text-2xl font-serif font-semibold
- **Body Text**: text-base font-sans (Inter)
- **Meta/Captions**: text-sm font-sans text-gray-600
- **Labels**: text-xs font-sans uppercase tracking-wider

## Layout System
**Spacing**: Tailwind units 4, 8, 12, 16, 24, 32 - generous white space throughout
- **Page Container**: max-w-7xl mx-auto px-6 md:px-12
- **Section Spacing**: py-24 md:py-32 (editorial breathing room)
- **Card Padding**: p-6 md:p-8
- **Masonry Gaps**: gap-6 md:gap-8

**Masonry Grid** (Primary Layout):
- Use CSS columns or Masonry.js for Pinterest-style layouts
- Breakpoints: columns-1 sm:columns-2 lg:columns-3 xl:columns-4
- Variable height cards create organic flow
- No forced aspect ratios on feed

## Component Library

### Navigation Bar
- Fixed: sticky top-0 z-50 backdrop-blur-lg bg-white/90
- Height: h-20, logo left (serif wordmark), centered nav links, auth right
- Links: Navy text with gold underline on hover (transition-all duration-300)
- Pill-shaped profile avatar with gold ring (ring-2 ring-gold)

### Trip/Photo Cards (Masonry Feed)
**Structure**: Vertical cards with variable heights
- Border radius: rounded-3xl (soft, premium feel)
- Shadow: shadow-lg hover:shadow-2xl (subtle, soft)
- Image: Full-bleed with rounded-t-3xl, natural aspect ratios
- Overlay gradient on hover: gradient from transparent to navy/80
- Content: Absolute positioned at bottom with backdrop-blur-md bg-white/90 p-6 rounded-b-3xl
- Title: text-xl font-serif font-semibold mb-2
- Location: Gold map pin icon + text-sm
- Engagement: Small pill badges (saves, likes) with maroon background
- Hover animation: transform translate-y-[-4px] duration-300

### Hero Section (Home Page)
**Large Editorial Hero**: min-h-[85vh] with cinematic photography
- Image: Full-width Paris rooftops/cozy cafés/mountain sunsets
- Overlay: gradient-to-b from-navy/40 to-navy/70
- Centered content with max-w-4xl
- Headline: text-6xl md:text-7xl font-serif text-white mb-6
- Subheadline: text-xl md:text-2xl text-white/90 mb-12
- CTA buttons: Pill-shaped (rounded-full px-10 py-4) with backdrop-blur-md bg-white/20 border-2 border-white/40
- Fade-in animation on mount (opacity-0 animate-fade-in)

### Trip Detail Page
**Layout**: Full-width hero + two-column content
- **Hero Image**: aspect-[21/9] rounded-3xl shadow-2xl mb-16 (cinematic destination photo)
- **Content Grid**: lg:grid-cols-[2fr_1fr] gap-12
- **Main Column**: 
  - Transport emoji with gold circle background (w-16 h-16 rounded-full bg-gold/20)
  - Title: text-4xl md:text-5xl font-serif mb-6
  - Date range with calendar icon (gold)
  - Description: text-lg leading-relaxed
  - Photo gallery: Masonry grid of additional destination images
- **Sidebar**: 
  - Sticky top-24
  - User card with avatar + username (font-serif)
  - Map: h-80 rounded-3xl shadow-lg
  - Save button: Pill-shaped maroon with gold icon

### Forms (Create Trip)
**Layout**: max-w-3xl mx-auto with generous spacing
- Labels: text-sm font-sans uppercase tracking-wider text-gray-700 mb-3
- Inputs: rounded-2xl border-2 border-gray-200 p-4 focus:border-navy focus:ring-4 focus:ring-navy/10
- Textareas: min-h-40 rounded-2xl
- Image upload: Dashed border area (rounded-3xl border-dashed border-2) with gold upload icon
- Submit: Pill-shaped navy button (rounded-full px-12 py-4 text-lg font-semibold)

### User Profile
**Header**: Full-width with subtle gradient background (navy to maroon)
- Avatar: w-32 h-32 rounded-full ring-4 ring-gold shadow-xl
- Username: text-4xl font-serif text-white mb-2
- Bio: text-lg text-white/80 max-w-2xl
- Stats: Horizontal pills showing trip count, followers (gold numbers)

**Content**: Tabbed sections (Destinations, Saved, Collections)
- Tabs: Pill-shaped navigation with maroon active state
- Content: Masonry grid of trip cards

### Buttons
**Primary**: Pill-shaped (rounded-full) navy background, white text, gold hover ring
**Secondary**: Pill-shaped outlined (border-2 border-navy), navy text, maroon hover background
**On Images**: backdrop-blur-md bg-white/20 border-2 border-white/50

## Images
**Hero Image**: Paris rooftops at golden hour - aspect-[21/9] with overlay gradient, positioned at top of home page
**Card Images**: Editorial travel photography (cozy Parisian cafés, mountain sunsets, architectural details, intimate cultural moments) - natural aspect ratios in masonry layout
**Profile Headers**: Destination collage or favorite travel photo as banner
**Detail Pages**: Large hero destination image (cinematic composition) + masonry gallery of 6-8 additional photos
**Empty States**: Illustrated suitcase icon with gold accents

## Animations
**Subtle Fade/Slide**:
- Page load: Stagger fade-in cards (delay increments of 100ms)
- Scroll reveal: Slide-up with opacity transition (translate-y-8 to translate-y-0)
- Card hover: Lift effect (transform translate-y-[-4px])
- Image zoom on hover: scale-105 within container
- All transitions: transition-all duration-300 ease-out

## Accessibility
- Focus rings: ring-4 ring-gold/50 on navy elements
- Semantic HTML with landmark regions
- Alt text emphasizing destination and mood
- High contrast text on photography (always use overlays/backdrops)

## Responsive Breakpoints
- **Mobile**: Single column masonry, stacked nav with drawer
- **Tablet** (md: 768px): 2-column masonry, horizontal nav
- **Desktop** (lg: 1024px): 3-4 column masonry, full sidebar layouts
- **Wide** (xl: 1280px): 4-column masonry, max content width

## Icons
**Heroicons** via CDN: Outline style in gold for navigation, solid style in maroon for status