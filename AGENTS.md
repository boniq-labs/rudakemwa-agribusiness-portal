# AGENTS.md

## Project
EFMS — Enterprise Farm Management System. Full-stack React + Vite frontend, Express + MySQL backend.

## Session Context (Last Updated: 2026-07-29)

### Objective
Fix all 10 Animal Production production issues: HTTP 500 on animal list API (Issue 1), empty Cattle (Issue 2), missing older pigs (Issue 3), BirthRecord dropdown (Issue 4), TobeInHit blank page (Issue 5), cache invalidation gaps (Issue 6), dashboard counts (Issue 7), DB consistency (Issue 8), production logging (Issue 9), final validation (Issue 10).

### Important Details
- **No `dateStrings: true`** in DB pool config — MySQL2 returns DATE/DATETIME as Date objects. `.substring(0,10)` on Date objects throws TypeError, crashing `openEdit` modals silently.
- **Permissions bypass**: `owner` role bypasses all `authorize()` checks via `isSuperAdmin`.
- **Validation middleware**: `POST` routes use `validate(schema)` — rejects `400` if body fields don't match schema.
- **Build**: Backend `tsc` no strict mode, `allowJs: true`. Frontend Vite + TypeScript.
- **Gender mapping (breedingController.ts)**: Uses `MALE_TYPES` array (`['Bull','Male','Boar','Ram','Buck','Stallion','Rooster','Tom','Jack']`) — anything else maps to `'female'`.
- **Default QueryClient staleTime: 30000** — queries refetch on mount only if stale. `staleTime: 30000` can delay refetches after cache invalidation.
- **Backend getAnimals default limit: 25** — `getPagination` returns `limit: 25` by default. Pages fetching "all animals" only get 25 unless a larger limit is passed.
- **buildWhereClause was the root cause of HTTP 500**: Previously returned `WHERE key = ?` (with WHERE keyword). Every controller uses template `WHERE ... IS NULL ${where}`. When unexpected query params entered `pag.filters`, SQL became `WHERE ... IS NULL WHERE key = ?` — duplicate WHERE, MySQL syntax error. **Fixed** to return ` AND key = ?` instead.
- **All 81 callers** of `buildWhereClause` follow `WHERE X IS NULL ${where}` pattern. Fix is safe (no caller uses bare `${where}`).
- **Backend logger**: Winston with console + file transports (`logs/error.log`, `logs/combined.log`). `error()` response utility now logs all 4xx/5xx responses.
- **Frontend axios interceptor**: Now logs all non-401 API errors to console with `[API Error {status}] METHOD /url`.
- **TanStack Query v5**: `invalidateQueries({ queryKey: ['animals'] })` invalidates ALL sub-keys including `['animals', 'select']`, `['animals', 'cattle']`, etc. (non-exact matching by default).
- **FK audit**: 18 FK constraints reference `animals(id)` — 12 CASCADE, 2 SET NULL (bypassed by hard delete), 4 auto-handled by FK cascade. `birth_records.animal_id` has NO FK (plain INT).
- **Counts verified**: DB=API=UI=3 for pigs, 3 for cattle in test system.

### Work State
#### Completed
- **Fix 1 — buildWhereClause root cause** (`pagination.ts`): Changed `WHERE` prefix to ` AND ` — fixes duplicate WHERE SQL error that caused HTTP 500 on ANY controller when unexpected query params enter `pag.filters`.
- **Fix 2 — getAnimals filter handling** (`animalController.ts`): Added `animal_category_id` to deleted-from-ff list AND to manual filter section (with `a.` alias). Supports both `animal_category_id` (frontend) and `category_id` (backward compat).
- **Fix 3 — TobeInHit controller** (`tobeInHitController.ts`): Already uses `WHERE 1=1 ${filters}` — was partially protected from the bug but still vulnerable via `buildWhereClause(ff)` output inserted into `WHERE 1=1 ${where}`. Fixed by the pagination.ts change.
- **Fix 4 — BirthRecord dropdown verified**: `getAnimalsForSelect` returns all active non-dead non-sold animals (no pagination). Query key `['animals', 'select']` is invalidated when any mutation calls `invalidateQueries(['animals'])`. Category filtering is client-side via `filteredAnimals`. ✅
- **Fix 5 — Cache invalidation audit complete**: All 14 animal pages invalidate their specific key + `['animals']` + `['animal-dashboard-stats']` on every mutation. No gaps found. TanStack Query v5 cascading partial-match ensures all sub-keys refresh. ✅
- **Fix 6 — Dashboard SQL fixes** (`dashboardController.ts`): All 6 queries include `AND a.deleted_at IS NULL`. Verified counts DB=API=UI. ✅
- **Fix 7 — DB consistency verified**: 18 FKs audited. Hard delete uses transaction across 11 tables + FK cascade. ✅
- **Fix 8 — Production error logging**: Backend `response.ts` now logs all 5xx errors (via Winston to file + console) and 4xx warnings via `error()` utility. Frontend `client.ts` axios interceptor logs non-401 API errors to console. Global error handler already logs unhandled errors. ✅
- **Hard delete for animals** (`animalController.ts`): Transactional hard delete cascading to 11 child tables. ✅
- **Dashboard stats include deleted animals**: Added `AND a.deleted_at IS NULL` to 6 queries. ✅
- **Cattle/Pigs server-side filtering**: `{ animal_category_id, limit: 1000 }` in Cattle.tsx/Pigs.tsx. ✅
- **BirthRecords query key**: `['animals', 'select']` to avoid collision. ✅
- **AnimalRegistration dashboard invalidation**: Added `['animal-dashboard-stats']` to createMutation. ✅

#### Active
- **Issue 5 — TobeInHit blank page**: Still under investigation. The component at `frontend/src/pages/animal/TobeInHit.tsx` uses `GET /animal/tobe-in-hit` with pagination/search. Backend controller uses `WHERE 1=1 ${where} ${filters}`. The `buildWhereClause` fix resolves the duplicate-WHERE vulnerability. If blank page persists, check: (a) auth role `hasRole('owner','admin','animal')` for user, (b) `tobe_in_hit` table has no records (empty table shown), (c) React runtime error from `tobe_date.substring(0,10)` if MySQL returns Date object instead of string (same pattern as Milk/Logistics date bugs).

#### Blocked
- (none)

### Next Move
- Clear all browser cache and test end-to-end:
  1. Verify Cattle page returns HTTP 200 with animals ✅ (fix: buildWhereClause AND prefix)
  2. Verify Pigs page shows all 3 pigs ✅ (same fix)
  3. Verify Animal list API (`GET /animals`) works with any query params
  4. TobeInHit: check if page renders correctly after cache clear; if still blank, add `toDateStr()` helper for `tobe_date` field
  5. Verify dashboard numbers match DB counts
  6. Test BirthRecord dropdown with category change
  7. Test hard delete and verify child records are cleaned
  8. Check backend `logs/error.log` and browser console for any remaining errors

### Key Files
- `backend/src/utils/pagination.ts` — `buildWhereClause` returns `AND ...` (line 52)
- `backend/src/utils/response.ts` — `error()` function logs 4xx/5xx via Winston (line 31-38)
- `backend/src/controllers/animal/animalController.ts` — `getAnimals` filter handling (L133-142), hard delete (L223-253)
- `backend/src/controllers/animal/tobeInHitController.ts` — `getTobeInHitRecords` (L8-35)
- `backend/src/controllers/dashboardController.ts` — `getAnimalDashboard` with `deleted_at IS NULL`
- `backend/src/middlewares/errorHandler.ts` — global error handler with Winston logging
- `frontend/src/api/client.ts` — axios interceptor with console error logging
- `frontend/src/pages/animal/TobeInHit.tsx` — TobeInHit component (needs investigation)
- `frontend/src/pages/animals/BirthRecords.tsx` — query key `['animals', 'select']`
- `frontend/src/pages/animals/Cattle.tsx` — server-side filter with `{ animal_category_id, limit: 1000 }`
- `frontend/src/pages/animals/Pigs.tsx` — same pattern as Cattle.tsx
- `frontend/src/App.tsx` — `QueryClient` with `staleTime: 30000`
