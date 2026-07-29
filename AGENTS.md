# AGENTS.md

## Project
EFMS — Enterprise Farm Management System. Full-stack React + Vite frontend, Express + MySQL backend.

## Session Context (Last Updated: 2026-07-29)

### Objective
Fix 6 Animal Production issues: cattle registration not appearing, hard delete, missing older pigs, pagination, birth record select, cache invalidation, dashboard counts.

### Important Details
- **No `dateStrings: true`** in DB pool config — MySQL2 returns DATE/DATETIME as Date objects. `.substring(0,10)` on Date objects throws TypeError, crashing `openEdit` modals silently.
- **Permissions bypass**: `owner` role bypasses all `authorize()` checks via `isSuperAdmin`.
- **Validation middleware**: `POST` routes use `validate(schema)` — rejects `400` if body fields don't match schema.
- **Build**: Backend `tsc` no strict mode, `allowJs: true`. Frontend Vite + TypeScript.
- **Gender mapping (breedingController.ts)**: Uses `MALE_TYPES` array (`['Bull','Male','Boar','Ram','Buck','Stallion','Rooster','Tom','Jack']`) — anything else maps to `'female'`.
- **Default QueryClient staleTime: 30000** — queries refetch on mount only if stale. `staleTime: 30000` can delay refetches after cache invalidation.
- **Backend getAnimals default limit: 25** — `getPagination` returns `limit: 25` by default. Pages fetching "all animals" only get 25 unless a larger limit is passed.
- **buildWhereClause** generates `WHERE key = ?` from query params not in exclude list (`page, limit, sort, order, search`). Custom filters like `category_id`, `status`, `gender` are handled separately in each controller.

### Work State
#### Completed
- **Fix 1 — Hard delete for animals** (`animalController.ts`): Replaced `UPDATE animals SET deleted_at=NOW()` with transactional hard delete cascading to 11 child tables (birth_records, breeding_records, pregnancies, vaccinations, treatments, feeding_records, weight_records, transfers, purchases, sales, deaths).
- **Fix 2 — Dashboard stats include deleted animals** (`dashboardController.ts`): Added `AND a.deleted_at IS NULL` to 6 queries in `getAnimalDashboard` (total, female, male, cattle, pigs, sick). Added JOIN for sick count.
- **Fix 3 — Cattle/Pigs pagination** (`Cattle.tsx`, `Pigs.tsx`): Changed query from fetching ALL animals (limit 25) then client-filtering by category, to fetching directly with `{ animal_category_id: id, limit: 1000 }` — server-side filtering returns only relevant animals with adequate limit.
- **Fix 4 — BirthRecords query key collision** (`BirthRecords.tsx`): Changed `queryKey: ['animals']` to `queryKey: ['animals', 'select']` to avoid cache collision with other `['animals']` prefix queries.
- **Fix 5 — Missing dashboard invalidation** (`AnimalRegistration.tsx`): Added `['animal-dashboard-stats']` invalidation to `createMutation.onSuccess` (was only in `updateMutation`).
- **All builds pass**: Backend `tsc --noEmit` ✅ (0 errors), Frontend `tsc --noEmit` ✅ (0 errors), Frontend `vite build` ✅ (10.20s).

#### Active
- (none)

#### Blocked
- (none)

### Next Move
- No remaining tasks. Clear browser cache and test all 5 fixes end-to-end.

### Key Files
- `backend/src/controllers/animal/animalController.ts` — hard delete, `deleteAnimal` (L222-252)
- `backend/src/controllers/dashboardController.ts` — `getAnimalDashboard` with `deleted_at IS NULL` filters
- `backend/src/utils/pagination.ts` — `getPagination` default limit 25
- `frontend/src/pages/animals/Cattle.tsx` — server-side category filter with `{ animal_category_id, limit: 1000 }`
- `frontend/src/pages/animals/Pigs.tsx` — server-side category filter with `{ animal_category_id, limit: 1000 }`
- `frontend/src/pages/animals/BirthRecords.tsx` — query key `['animals', 'select']`
- `frontend/src/pages/animals/AnimalRegistration.tsx` — `createMutation` dashboard-stats invalidation
- `frontend/src/App.tsx` — `QueryClient` with `staleTime: 30000`
