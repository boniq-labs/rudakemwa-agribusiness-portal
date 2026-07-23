# Plan: Replace Collector Dropdown with Collector Name Text Input

## Overview
Replace the broken Collector employee dropdown with a manual `collector_name` text input in Morning Production and Evening Production. Store `collector_name` directly in `milk_collections` table alongside existing `collector_id`.

## Files to Modify

### Phase 1: Database Migration
- **`backend/src/config/migrate.ts`** — Add `collector_name VARCHAR(255)` column to `milk_collections` table

### Phase 2: Backend
- **`backend/src/validators/modules.ts`** — `createMilkCollectionSchema`: replace `collector_id: z.number().int().positive()` with `collector_name: z.string().min(1, 'Collector name is required')`
- **`backend/src/controllers/milk/milkCollectionController.ts`** — 
  - `createMilkCollection`: INSERT `collector_name` (from req.body) + keep `collector_id` as nullable
  - `updateMilkCollection`: UPDATE `collector_name` (from req.body) + keep `collector_id` as nullable
  - `getMilkCollections`: Change JOIN `users u ON mc.collector_id = u.id` to use `COALESCE(mc.collector_name, u.first_name)` so old records (with `collector_id` but no `collector_name`) still show names
- **`backend/src/routes/index.ts`** — Remove `GET /milk/collectors` route (no longer needed; remove entire block lines 522-540)

### Phase 3: Frontend — MorningProduction.tsx
- Remove `useQuery` for `['milk-collectors']`
- Remove `collectorList` variable
- Change form state: `collector_id` → `collector_name`
- Change `<select>` dropdown → `<input type="text" placeholder="Enter collector name" required>`
- Change `handleSubmit`: send `collector_name` instead of `collector_id`
- Change `openEdit`: read `c.collector_name` instead of `c.collector_id`
- Keep table column `collector_name` render (already uses `c.collector_name`)

### Phase 4: Frontend — EveningProduction.tsx
- Same changes as MorningProduction.tsx

### Phase 5: Reports / Dashboard
- **`MilkReports.tsx`**: No changes needed — it aggregates by date/time, not by collector
- **`MilkDashboard.tsx`**: No changes needed — it shows totals, not collector info
- **`backend/src/routes/index.ts` `/milk/reports`**: No changes needed — aggregates by date
- **Backend dashboard controller**: No changes needed — uses SUM/AVG only

## Detailed Changes

### migrate.ts — Add column
After the CREATE TABLE for `milk_collections`, add ALTER TABLE in the `alterQueries` array:
```sql
ALTER TABLE milk_collections ADD COLUMN IF NOT EXISTS collector_name VARCHAR(255) AFTER collector_id
```

### Schema — Validation
Replace:
```ts
collector_id: z.number().int().positive(),
```
With:
```ts
collector_name: z.string().min(1, 'Collector name is required'),
```

### Controller — createMilkCollection
Change INSERT to include `collector_name`:
```ts
const { collection_date, time, collector_name, branch_id, quantity_liters, number_of_animals, notes } = req.body;
// INSERT now: collection_date, time, collector_name, branch_id, quantity_liters, number_of_animals, notes
// collector_id stays NULL for new records
```

### Controller — updateMilkCollection
Change UPDATE to include `collector_name`:
```ts
const { collection_date, time, collector_name, branch_id, quantity_liters, number_of_animals, notes } = req.body;
// UPDATE now: SET collection_date=?, time=?, collector_name=?, branch_id=?, quantity_liters=?, number_of_animals=?, notes=?
// collector_id unchanged for existing records
```

### Controller — getMilkCollections
Change the SELECT query to use COALESCE for backward compatibility:
```ts
SELECT mc.*, COALESCE(mc.collector_name, u.first_name) as collector_name, b.name as branch_name
FROM milk_collections mc
LEFT JOIN users u ON mc.collector_id = u.id
LEFT JOIN branches b ON mc.branch_id = b.id
```
Note: Changed to LEFT JOIN for users since new records won't have collector_id.

### Frontend Changes (MorningProduction.tsx)

1. Remove the collector fetch: delete lines 26-29 (the `useQuery` for `['milk-collectors']`)
2. Remove: `const collectorList = Array.isArray(collectors) ? collectors : [];`
3. Change initialForm: `collector_id: ''` → `collector_name: ''`
4. Change handleSubmit payload: `collector_id: ...` → `collector_name: form.collector_name`
5. Change openEdit: `collector_id: String(c.collector_id || '')` → `collector_name: c.collector_name || ''`
6. Replace the `<select>` dropdown with `<input type="text">`

### Frontend Changes (EveningProduction.tsx)
Identical to MorningProduction.tsx changes.

## Verification
1. Frontend `npx vite build` — zero errors
2. Backend `npx tsc --noEmit` — zero errors
3. Verify Morning Production: Create, Edit (shows saved name), Delete
4. Verify Evening Production: Create, Edit (shows saved name), Delete
5. Verify table displays collector_name for new AND old records
6. Verify reports unaffected
7. Verify dashboard unaffected
