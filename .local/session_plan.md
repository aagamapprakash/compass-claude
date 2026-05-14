# Objective
Add edit functionality for itinerary stops and expenses. Currently, users can only add and delete these items — they need the ability to edit existing ones inline. The backend PATCH endpoints already exist for both stops (`PATCH /api/trips/:tripId/stops/:stopId`) and expenses (`PATCH /api/expenses/:id`), so this is primarily a frontend task with a small backend update for expense amount editing.

# Tasks

### T001: Add inline edit mode for itinerary stops
- **Blocked By**: []
- **Details**:
  - Add an "Edit" button (pencil icon) next to each stop's reorder/delete controls (visible when `canEdit` is true)
  - Clicking edit transforms the stop's display into an editable form pre-filled with current values: name, start/end dates, notes, link, confirmation number, attachment type
  - Include Save and Cancel buttons; Save calls `PATCH /api/trips/:tripId/stops/:stopId`
  - On success, invalidate the stops query and exit edit mode
  - All interactive elements get `data-testid` attributes
  - Files: `client/src/components/TripStops.tsx`
  - Acceptance: Users can click Edit on a stop, modify fields, save changes, and see updates reflected immediately

### T002: Add inline edit mode for expenses and update backend
- **Blocked By**: []
- **Details**:
  - **Backend**: Update `PATCH /api/expenses/:id` in `server/routes.ts` to allow `amount` changes; when amount changes, recalculate the equal splits for that expense (update each split's amount to new total / number of splits)
  - **Frontend**: Add an "Edit" button (pencil icon) on each expense item, next to the expand/delete buttons (visible to payer or trip owner)
  - Clicking edit transforms the expense display into an editable form pre-filled with: description, amount (cents → dollars), category, date, assigned-to user
  - Include Save and Cancel buttons; Save calls `PATCH /api/expenses/:id`
  - On success, invalidate the expenses and balances queries, exit edit mode
  - All interactive elements get `data-testid` attributes
  - Files: `client/src/components/TripStops.tsx`, `server/routes.ts`, `server/storage.ts`
  - Acceptance: Users can edit expense description, amount, category, date, and assigned-to; splits recalculate when amount changes

### T003: Test and update documentation
- **Blocked By**: [T001, T002]
- **Details**:
  - Run e2e tests to verify editing stops and expenses works correctly
  - Update `replit.md` to document the new edit capabilities
  - Files: `replit.md`
  - Acceptance: Tests pass, documentation updated
