# AGENTS.md

## Project
EFMS — Enterprise Farm Management System. Full-stack React + Vite frontend, Express + MySQL backend.

## Session Context (Last Updated: 2026-07-29)

### Objective
Fix 12 production issues: Animal Production birth records (category→animal dependency), mobile CRUD, dashboard death counts, new Tobe in hit module, Crop Manager sales permissions, Milk Production cleanup (remove customers/reports, fix dashboard), Milk Manager veterinary permissions, Accounting expense `payment_method` column, and mobile cross-module functionality.

### Important Details
- **Cross-department permissions**: backend `authenticate` middleware merges permissions from `departmentRoleMap` (`departmentAccess.ts`) — e.g. `crops` role gets `sales.*`, `milk` gets `veterinary.*`.
- **Birth Records fix**: `getAnimalsForSelect` SQL in `animalController.ts:234` added `a.animal_category_id` to SELECT — fixes category→animal dropdown dependency.
- **Animal death deletion**: `deleteAnimalDeath` (`movementController.ts`) now also updates animal status back to `'active'` after soft-deleting the death record (previously left animal as `'dead'`, inflating dashboard death count).
- **Expense `payment_method` column**: migration 013 (`alter_expense_records_add_columns`) + initial schema update added `payment_method`, `vendor`, `notes` to `expense_records` table.
- **Milk Dashboard**: refactored to 4 real DB metric cards (Total Today, Morning, Evening, Avg/Animal) from `/dashboard/milk`.
- **Tobe in Hit**: new module under Animal Production — backend CRUD controller, routes, `tobe_in_hit` table (migration 014 + initial schema), frontend page under `/animals/tobe-in-hit`, sidebar link.

### Work State
#### Completed
- **getAnimalsForSelect** (`animalController.ts:234`): Added `a.animal_category_id` to SELECT.
- **deleteAnimalDeath** (`movementController.ts`): Now restores animal status to `'active'` after death deletion.
- **authenticate middleware** (`auth.ts`): Merges cross-department role permissions via `departmentRoleMap`.
- **departmentAccess.ts**: Exported `departmentRoleMap` so `auth.ts` can import it.
- **Expense `payment_method` column**: Migration 013 + initial schema update. Registered in `database/index.ts`.
- **MilkDashboard.tsx**: Removed Revenue/Products/Recent Collections — 4 StatsCards from `/dashboard/milk`.
- **Sidebar.tsx**: Removed Customers, Daily Reports from Milk Production section.
- **App.tsx**: Removed MilkCustomers, MilkRoutes imports & routes. Added TobeInHit lazy import + route.
- **Tobe in Hit module**: New table (`tobe_in_hit`), controller (`tobeInHitController.ts`), routes, frontend page (`TobeInHit.tsx`), sidebar link.
- **Frontend build**: `npx vite build` — zero errors.
- **Backend build**: `npx tsc --noEmit` — zero errors.

#### Active
- Mobile CRUD fixes (Issue 2/9): Not yet investigated — poultry/pig/cattle pages need touch event audit.

#### Blocked
- (none)

### Next Move
1. Audit Animal Production pages (Pigs.tsx, Cattle.tsx, BirthRecords.tsx) for mobile touch/click issues.
2. Restart backend + frontend servers to verify all fixes end-to-end.

### Key Files
- `backend/src/controllers/animal/animalController.ts:234` — getAnimalsForSelect added `animal_category_id`
- `backend/src/controllers/animal/movementController.ts` — deleteAnimalDeath restores animal status
- `backend/src/middlewares/auth.ts` — authenticate merges cross-department permissions
- `backend/src/utils/departmentAccess.ts` — departmentRoleMap exported
- `backend/src/controllers/animal/tobeInHitController.ts` — new Tobe in hit CRUD
- `backend/src/routes/index.ts` — Tobe in hit routes registered
- `backend/src/database/migrations/014_create_tobe_in_hit.ts` — new table
- `backend/src/database/migrations/013_alter_expense_records_add_columns.ts` — expense columns
- `frontend/src/pages/animal/TobeInHit.tsx` — new Tobe in hit page
- `frontend/src/pages/milk/MilkDashboard.tsx` — refactored to 4 real metric cards
- `frontend/src/App.tsx` — removed MilkCustomers/MilkReports routes, added TobeInHit route
- `frontend/src/layouts/Sidebar.tsx` — removed Milk Customers/Reports, added Tobe in Hit
