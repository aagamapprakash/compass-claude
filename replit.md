# Compass - Social Travel Web App

## Overview

Compass is a social travel planning application that enables users to create, share, and discover travel adventures. Users can plan trips, invite friends, and explore destinations shared by other travelers. The application features a card-based interface inspired by modern travel platforms, with emphasis on visual storytelling and effortless navigation.

**Social Features (Added Feb 2026):**
- Public/private trips: Users can toggle `isPublic` when creating trips. Private trips are only visible to the owner and trip members.
- Community feed at `/community`: Shows all public trips with like counts and user attribution.
- Follow system: Users can follow/unfollow other users from their profile page. Follower/following counts displayed on profiles.
- Like system: Users can like trips from both TripCard (community/profile) and TripDetail pages. Like counts shown on cards.
- Profile pages show follow stats (followers/following counts) and follow/unfollow button for other users.
- API routes: `/api/feed/public`, `/api/users/:id/follow` (POST/DELETE), `/api/trips/:id/like` (POST/DELETE), `/api/users/:id/follow-stats`, `/api/trips/:id/like-info`
- Database tables: `follows` (follower/following relationships), `trip_likes` (user likes on trips), `isPublic` column on trips table

**Budgeting & Expense Tracking (Added Mar 2026):**
- Expenses are embedded inline within the itinerary card — each stop shows its linked expenses with an "Add Expense" button
- Expenses not tied to a stop appear in a "General Expenses" section at the bottom of the itinerary
- Running total footer at the bottom of the itinerary card
- Expense categories: Lodging, Food, Equipment Rentals, Experiences, Transportation, Other
- Traveller assignment: expenses can be tagged to a specific member via `assignedToUserId` ("this expense is for X")
- Custom split selection: when adding an expense, users can choose which members split the cost (defaults to all members)
- Per-split settle/unsettle toggle for tracking payments
- Simplified debt calculation: shows "who owes whom" in the sidebar Balances card
- Amounts stored in cents (integer) to avoid floating point issues
- Database tables: `expenses` (expense records with category, amount, paidBy, stopId, assignedToUserId), `expense_splits` (per-user share with settled status)
- API routes: `GET/POST /api/trips/:id/expenses`, `PATCH/DELETE /api/expenses/:id`, `PATCH /api/expense-splits/:id/settle`, `GET /api/trips/:id/balances`
- POST `/api/trips/:id/expenses` accepts optional `splitAmong` (array of user IDs) and `assignedToUserId`
- Components: `TripStops.tsx` (itinerary + inline expenses + add expense forms), `TripBalances.tsx` (simplified debt summary in sidebar)

**Enhanced Itinerary (Added Mar 2026):**
- Trip stops now support optional fields: link (URL), confirmationNumber, attachmentType (Hotel Booking, Flight, Car Rental, Activity, Restaurant, Other)
- Links display as clickable external links, confirmation numbers have copy-to-clipboard functionality
- Turns each trip into a one-stop hub for all travel details
- Inline edit mode for stops: pencil icon opens editable form pre-filled with current values (name, dates, type, link, confirmation #, notes); Save/Cancel buttons
- Inline edit mode for expenses: pencil icon opens editable form pre-filled with description, amount (cents→dollars), category, date, assigned-to; amount changes trigger split recalculation on backend
- Backend `PATCH /api/expenses/:id` now accepts `amount` field; `storage.recalculateExpenseSplits()` redistributes splits equally when amount changes

**Tech Stack:**
- Frontend: React + TypeScript + Vite
- Styling: Tailwind CSS + shadcn/ui components
- Backend: Express.js
- Database: PostgreSQL (via Neon) with Drizzle ORM
- State Management: TanStack Query
- Routing: Wouter

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Component-Based Structure**
- Uses React with TypeScript for type-safe component development
- Implements shadcn/ui component library following the "new-york" style variant
- Component organization follows domain-driven design with reusable UI components in `/client/src/components/ui`
- Page-level components in `/client/src/pages` handle routing and data orchestration

**Styling System**
- Tailwind CSS for utility-first styling with custom design tokens
- Custom color palette based on brand colors (Compass Blue: #00357a, Maroon: #7B1E3C, Gold: #F5C542)
- Consistent spacing system using Tailwind's standard scale (2, 4, 6, 8, 12, 16, 20, 24)
- Responsive design patterns with mobile-first breakpoints
- CSS custom properties for theme configuration in `client/src/index.css`

**State Management Strategy**
- TanStack Query for server state management and data fetching
- Local component state using React hooks (useState, useCallback)
- Context API for sidebar navigation state (SidebarContext)
- In-memory storage layer for development (MemStorage class)

**Routing Approach**
- Wouter for lightweight client-side routing
- Route configuration in `App.tsx` with Switch/Route components
- Dynamic routes for trip and profile pages (e.g., `/trip/:id`, `/profile/:userId`)

### Backend Architecture

**Server Framework**
- Express.js for HTTP server and API routing
- HTTP server creation using Node's `createServer` for upgrade path to WebSockets
- Middleware stack includes JSON parsing with raw body preservation (for webhook support)
- Custom logging middleware for request/response tracking

**API Design Pattern**
- RESTful API structure with `/api` prefix for all endpoints
- Route registration pattern in `server/routes.ts` for separation of concerns
- Static file serving for production builds via `server/static.ts`
- Development mode uses Vite middleware for HMR

**Storage Layer Abstraction**
- Interface-based storage design (`IStorage`) for flexible implementation swapping
- Current implementation uses in-memory storage (`MemStorage`) for development
- Ready for database integration via the storage interface
- CRUD operations abstracted through storage methods

### Data Storage

**Database Technology**
- PostgreSQL database hosted on Neon serverless platform
- Connection pooling via `@neondatabase/serverless` with WebSocket support
- Database schema defined in `shared/schema.ts` using Drizzle ORM

**Schema Design**
- Users table with UUID primary keys, username/password fields
- Schema validation using Zod through `drizzle-zod` integration
- Type inference for Insert and Select operations
- Migration support via Drizzle Kit with migrations stored in `/migrations`

**ORM Choice Rationale**
- Drizzle ORM selected for TypeScript-first design and type safety
- Allows direct SQL-like queries while maintaining type inference
- Lightweight compared to heavier ORMs like TypeORM
- Built-in migration tooling and schema validation

### Build System

**Development Workflow**
- Vite as the frontend build tool with React plugin
- TypeScript compilation with strict mode enabled
- Hot Module Replacement (HMR) in development via Vite server
- Path aliases configured for clean imports (`@/`, `@shared/`, `@assets/`)

**Production Build Process**
- Custom build script (`script/build.ts`) orchestrates client and server builds
- Client built with Vite to `dist/public`
- Server bundled with esbuild to reduce cold start times
- Selective bundling of dependencies (allowlist) to optimize syscalls
- External dependencies not bundled to reduce bundle size

**Module System**
- ES Modules (ESM) throughout the codebase (`"type": "module"` in package.json)
- Dynamic imports for Replit-specific plugins in development
- Import path resolution via tsconfig baseUrl and paths

### Authentication & Authorization

**Current Implementation**
- Basic username/password authentication (in-memory for development)
- User management through storage layer interface
- Session management prepared but not yet implemented
- Auth form component with validation using react-hook-form + Zod

**Planned Architecture**
- Session-based authentication using `express-session`
- PostgreSQL session store via `connect-pg-simple`
- Passport.js integration for local strategy (dependencies present)
- Password hashing (implementation pending)

### Design System

**Component Library**
- shadcn/ui components as foundation (Radix UI primitives)
- Custom components extend shadcn base with brand-specific styling
- Consistent border radius system (sm: 3px, md: 6px, lg: 9px)
- Elevation system using shadows and opacity-based overlays

**Typography**
- Inter font family as primary typeface (loaded via Google Fonts)
- Hierarchical scale: Hero (text-4xl/5xl), Sections (text-2xl/3xl), Body (text-base)
- Font weight variations for emphasis (normal, medium, semibold, bold)

**Interactive Elements**
- Trip cards with hover elevation effects
- Status badges with semantic coloring (upcoming/current/past)
- Transport mode icons using emoji for universal recognition
- Map integration via Leaflet for location visualization

## External Dependencies

### Third-Party Services

**Neon Database**
- Serverless PostgreSQL platform for data persistence
- WebSocket-based connection pooling for serverless environments
- Environment variable: `DATABASE_URL` required for database connection

**Leaflet Maps**
- Open-source mapping library for trip location visualization
- CDN-delivered CSS loaded in `client/index.html`
- Coordinate mapping for major destinations in `MapView` component

**Google Fonts**
- Inter font family for consistent typography
- CDN delivery for optimal loading performance

### Key Libraries

**UI & Styling**
- `@radix-ui/*`: Headless UI primitives for accessible components
- `tailwindcss`: Utility-first CSS framework
- `class-variance-authority`: Type-safe variant styling
- `lucide-react`: Icon library for consistent iconography

**Forms & Validation**
- `react-hook-form`: Form state management with minimal re-renders
- `zod`: Schema validation for type-safe data
- `@hookform/resolvers`: Integration between react-hook-form and Zod

**Data Fetching**
- `@tanstack/react-query`: Server state management and caching
- Configured with infinite stale time and disabled refetch policies

**Database & ORM**
- `drizzle-orm`: TypeScript ORM for PostgreSQL
- `drizzle-zod`: Schema-to-Zod validation integration
- `drizzle-kit`: Migration and schema management tooling

**Routing & Navigation**
- `wouter`: Lightweight React routing library (~1.5kB)
- Pattern matching for dynamic routes

**Development Tools**
- `vite`: Frontend build tool and dev server
- `esbuild`: Fast server bundling for production
- `tsx`: TypeScript execution for development scripts
- Replit-specific plugins for development experience (cartographer, dev-banner, runtime-error-modal)