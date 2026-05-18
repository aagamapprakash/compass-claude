# Compass - Social Travel Web App

## Overview

Compass is a social travel planning application where users can create, share, and discover travel adventures. Users plan trips, invite friends, track expenses, and explore destinations shared by other travelers.

## Tech Stack

- **Frontend:** React + TypeScript + Vite
- **Styling:** Tailwind CSS + shadcn/ui (new-york variant)
- **Backend:** Express.js (Node.js)
- **Database:** PostgreSQL via Supabase, accessed with Drizzle ORM (`postgres` driver)
- **Auth:** Supabase Auth (stateless JWT — no server sessions)
- **State Management:** TanStack Query
- **Routing:** Wouter

## Project Structure

```
client/src/
  pages/        # Page-level components (Home, TripDetail, Profile, etc.)
  components/   # Shared components; ui/ contains shadcn primitives
  lib/          # supabase.ts client, queryClient, utils
server/
  index.ts      # Express app entrypoint
  routes.ts     # All API route registrations
  storage.ts    # DatabaseStorage class — all DB queries via Drizzle
  db.ts         # Drizzle client (postgres driver → Supabase)
  auth/         # Supabase auth middleware + user upsert storage
  static.ts     # Production static file serving
shared/
  schema.ts     # Drizzle schema + Zod types (source of truth for DB + types)
```

## Key Conventions

- All amounts stored in **cents** (integers) to avoid floating point issues
- Auth is stateless: every API request sends `Authorization: Bearer <jwt>` — the `isAuthenticated` middleware in `server/auth/supabaseAuth.ts` verifies it and upserts the user
- The `authStorage.upsertUser()` call in `isAuthenticated` keeps our `users` table in sync with Supabase Auth on every request
- DB schema lives in `shared/schema.ts`; run `npm run db:push` after any schema change

## Commands

```bash
npm run dev      # Start dev server (localhost:3001)
npm run build    # Production build
npm run db:push  # Push schema changes to Supabase database
npm run check    # TypeScript type check
```

## Environment Variables

See `.env.example` for required variables. Key ones:
- `DATABASE_URL` — Supabase PostgreSQL direct connection string
- `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` — server-side Supabase client
- `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` — browser-side Supabase client
- `GOOGLE_PLACES_API_KEY` — places autocomplete

## Features

### Social
- Public/private trips (`isPublic` toggle on creation)
- Community feed (`/community`) — all public trips with like counts
- Follow system — follow/unfollow users from profile; follower/following counts shown
- Like system — like trips from TripCard and TripDetail
- API: `/api/feed/public`, `/api/users/:id/follow`, `/api/trips/:id/like`, `/api/users/:id/follow-stats`

### Trips & Itinerary
- Trip stops with optional link, confirmationNumber, attachmentType (Hotel Booking, Flight, etc.)
- Links shown as clickable external links; confirmation numbers have copy-to-clipboard
- Inline edit mode for stops (pencil icon → pre-filled form)
- Join requests for non-member trips

### Budgeting & Expenses
- Expenses embedded inline within each itinerary stop; general expenses in a footer section
- Categories: Lodging, Food, Equipment Rentals, Experiences, Transportation, Other
- Assignee: tag an expense to a specific trip member
- Custom split selection: choose which members split a cost (defaults to all)
- Per-split settle/unsettle toggle
- Simplified debt calculation ("who owes whom") in the sidebar Balances card
- Inline edit for expenses (pencil icon); changing amount recalculates splits
- API: `GET/POST /api/trips/:id/expenses`, `PATCH/DELETE /api/expenses/:id`, `PATCH /api/expense-splits/:id/settle`, `GET /api/trips/:id/balances`

## Design Tokens (`better-design` branch)

The `better-design` branch overhauls the visual language to a minimalist analog / neobrutalist aesthetic. The values below reflect the current branch state and differ from `main`.

- **Brand colors (remapped):**
  - Compass Navy → Sage `#425650` (CSS: `compass-navy`)
  - Maroon `#7A1F2D` (unchanged, CSS: `compass-maroon`)
  - Gold `#D4A259` (unchanged, CSS: `compass-gold`)
  - Added: Ink `#1b1c19` (`compass-ink`), Sage `#5a6e68` (`compass-sage`), Parchment `#fbf9f4` (`compass-parchment`)
- **Typography:** Newsreader (serif + sans), JetBrains Mono (mono) — loaded via Google Fonts in `client/index.html`
- **Border radius:** near-sharp corners (`--radius: 0.125rem`); `rounded-3xl` / `rounded-4xl` → `0.25rem`
- **Shadows:** hard offset shadows (no blur) — `.hard-shadow` (3px 3px), `.hard-shadow-sm` (2px 2px) defined in `client/src/index.css`
- **Background:** warm parchment `hsl(40 30% 97%)` (`--background`)

## Known Bugs Fixed

### Auth race condition — profile link `/profile/undefined` (fixed in `better-design`)
After login, `onAuthStateChange` set `isAuthenticated = true` immediately but `fetchProfile` (which populates `user`) is async. During that window the sidebar Profile link resolved to `/profile/undefined` → "Traveler Not Found."

**Fix:** `client/src/hooks/use-auth.ts` — `onAuthStateChange` now sets `isLoading = true` before calling `fetchProfile`, so the loading screen persists until the profile is resolved.

**Fix:** `client/src/App.tsx` — Profile link only rendered when `user` is loaded (`...(user ? [{ href: /profile/${user.id} }] : [])`).

## TypeScript Config

`tsconfig.json` uses `moduleResolution: "bundler"`. The `baseUrl` option was removed (deprecated in TS 6.0, removed in TS 7.0) — `paths` aliases (`@/*`, `@shared/*`) work without it under this resolver.
