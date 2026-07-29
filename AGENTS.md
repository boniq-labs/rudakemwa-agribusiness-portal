# AGENTS.md

## Project
EFMS — Enterprise Farm Management System. Full-stack React + Vite frontend, Express + MySQL backend.

## Session Context (Last Updated: 2026-07-29)

### Objective
Fix production issues across all modules: Animal Production (birth records gender, TobeInHit, mobile CRUD), Admin Dashboard (stale data), mobile responsiveness (delete, touch targets, modals), and cross-module mobile audit.

### Important Details
- **No `dateStrings: true`** in DB pool config — MySQL2 returns DATE/DATETIME as Date objects. `.substring(0,10)` on Date objects throws TypeError, crashing `openEdit` modals silently.
- **Permissions bypass**: `owner` role bypasses all `authorize()` checks via `isSuperAdmin`.
- **Validation middleware**: `POST` routes use `validate(schema)` — rejects `400` if body fields don't match schema.
- **Build**: Backend `tsc` no strict mode, `allowJs: true`. Frontend Vite + TypeScript.
- **Gender mapping (breedingController.ts)**: Uses `MALE_TYPES` array (`['Bull','Male','Boar','Ram','Buck','Stallion','Rooster','Tom','Jack']`) — anything else maps to `'female'`.
- **Birth Records GENDER_OPTIONS**: Keyed by category name (Cattle, Pigs, Sheep, Goats, Horses, Poultry) with `DEFAULT` fallback.
- **Mobile delete fix root cause**: `confirm()` blocks/fails silently in iOS PWA/standalone mode. Fix: `touch-action: manipulation` CSS + `e.stopPropagation()` on all delete buttons.
- **Dashboard stale cache**: `refetchOnMount: true` + `staleTime: 0` required on all queries. SQL YEAR filter: `AND YEAR(date)=YEAR(CURDATE())`.

### Work State
#### Completed
- **MilkDashboard.tsx**: Refactored to 4 real DB metric cards (Total Today, Morning, Evening, Avg/Animal) from `/dashboard/milk`.
- **Sidebar.tsx**: Removed Customers, Daily Reports from Milk Production section.
- **App.tsx**: Removed MilkCustomers, MilkRoutes imports & routes. Added TobeInHit lazy import + route.
- **Tobe in Hit module**: New table (`tobe_in_hit`), controller (`tobeInHitController.ts`), routes, frontend page (`TobeInHit.tsx`), sidebar link.
- **Mobile CRUD audit (all 12 Animal Production pages)**: Wrapped action buttons in `.actions` class. Breeding.tsx radio buttons `flexWrap: 'wrap'` + `minHeight: 44`. Pagination buttons 44px touch targets on mobile. CSS `.actions { display: flex; flex-wrap: wrap; align-items: center; }`.
- **Birth Records gender options**: `GENDER_OPTIONS` map expanded (Cattle: Bull/Cow, Pigs: Boar/Sow, Sheep: Ram/Ewe, Goats: Buck/Doe, Horses: Stallion/Mare, Poultry: Rooster/Hen, DEFAULT: Male/Female). Backend gender mapping uses `MALE_TYPES` array instead of `type === 'Bull' ? 'male' : 'female'`.
- **TobeInHit pagination**: Fixed — added `pages: data?.meta?.pages || 1` to DataTable.
- **Admin Dashboard stale cache**: Added `refetchOnMount: true` + `staleTime: 0` to all 4 dashboard queries. SQL YEAR filter added to income/expense aggregation queries.
- **Delete on mobile**: Added `touch-action: manipulation; -webkit-touch-callout: none;` CSS to table buttons. Added `e.stopPropagation()` to ALL delete buttons (BirthRecords, AnimalDeaths, AnimalSales, Breeding, Vaccination, DiseaseManagement, Feeding).
- **Mobile responsiveness Phase 5**: Sticky table headers (`.table thead { position: sticky; top: 0; }`). Body scroll lock for modals (`body.modal-open { overflow: hidden; }` + `useEffect` in `Modal.tsx`). Verified all charts use `ResponsiveContainer width="100%"`.
- **Frontend build**: `npx vite build` — zero errors.
- **Backend build**: `npx tsc --noEmit` — zero errors.

#### Active
- (none — all phases completed)

#### Blocked
- (none)

### Next Move
- No remaining tasks. Restart backend + frontend servers to verify end-to-end.

### Key Files
- `frontend/src/pages/animals/BirthRecords.tsx` — GENDER_OPTIONS map + DEFAULT fallback
- `backend/src/controllers/animal/breedingController.ts` — MALE_TYPES gender mapping
- `backend/src/controllers/animal/tobeInHitController.ts` — Tobe in hit CRUD
- `frontend/src/pages/animal/TobeInHit.tsx` — Tobe in hit page (pagination fixed)
- `frontend/src/pages/admin/DashboardPage.tsx` — refetchOnMount + staleTime:0
- `backend/src/controllers/admin/dashboardController.ts` — YEAR filter in SQL
- `frontend/src/styles/index.css` — all mobile responsive rules, touch-action, sticky headers
- `frontend/src/components/Modal.tsx` — body scroll lock via useEffect
- `frontend/src/layouts/Sidebar.tsx` — Milk Customers/Reports removed
- `frontend/src/App.tsx` — TobeInHit route added
