# Improve Expense Splitting Between Travellers

## What & Why
The budgeting feature currently always splits expenses equally and always attributes payment to the current user. This makes it inadequate for real group travel: friends pay for each other all the time, and costs often need to be split unevenly (e.g. one person has a bigger room, or bought extra items). This task adds a proper "paid by" selector and custom unequal splits.

## Done looks like
- When adding an expense, users can choose **who paid** from a dropdown of all trip members (not locked to themselves)
- Users can switch from "Equal" split to "Custom" split mode, where they enter a specific dollar amount for each traveller; the amounts must sum to the total
- A running "remaining to assign" counter shows how much is left to distribute in custom mode
- The form prevents saving if custom amounts don't add up to the total (with a clear error message)
- Editing an existing expense also exposes the "paid by" and custom split fields
- The backend stores custom split amounts correctly and the balances card reflects them accurately

## Out of scope
- Percentage-based splits (dollar amounts only)
- Changing the payer after an expense is saved (edit form will show paidBy as read-only info)
- Multi-currency support

## Tasks
1. **Backend: accept paidByUserId from request body and support custom splits** — Update `POST /api/trips/:id/expenses` to accept `paidByUserId` from the request body (validated against trip members) instead of always using the authenticated user. Add support for a `splitDetails` array of `{userId, amount}` pairs alongside the existing `splitAmong` (equal) mode; when `splitDetails` is provided, insert split rows with those exact amounts.

2. **Expense form: "Paid by" selector and custom split amounts** — In `InlineExpenseForm`, add a "Paid by" Select dropdown listing all trip members (defaulting to current user). Add a third split mode button "Custom" next to "Everyone"/"Custom" — when selected, show a per-member row with a dollar amount input; display a running total and highlight when amounts don't match the expense total. Wire the form to pass either `splitAmong` or `splitDetails` to the API.

3. **Expense edit form: show paidBy and support custom amounts on edit** — In the `ExpenseItem` edit form, display who paid (read-only) and allow changing split amounts. Update `PATCH /api/expenses/:id` to accept `splitDetails` and re-create splits accordingly in `recalculateExpenseSplits`.

## Relevant files
- `client/src/components/TripStops.tsx:82-267`
- `server/routes.ts:694-732`
- `server/storage.ts:343-357`
- `shared/schema.ts:68-88,153-170`
