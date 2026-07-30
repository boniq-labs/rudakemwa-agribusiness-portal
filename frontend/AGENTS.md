# AGENTS.md – Anchored Summary

## Project: EFMS (Enterprise Farm Management System)

### Session Focus: Admin Dashboard, Animal Dashboard, Veterinary CRUD, Responsive Audit, Cross-module CRUD validation

#### Important Details
- **No `dateStrings: true`** in DB pool config — MySQL2 returns DATE/DATETIME as Date objects. `.substring(0,10)` or `.split('T')[0]` on Date objects throws TypeError.
- **Permissions bypass**: `owner` role bypasses all `authorize()` checks via `isSuperAdmin`.
- **Validation middleware**: `POST` routes use `validate(schema)` — rejects 400 if body fields mismatch.
- **Build**: Backend `tsc` no strict mode, `allowJs: true`. Frontend Vite + TypeScript.
- **TanStack Query v5**: `invalidateQueries({ queryKey: ['animals'] })` invalidates ALL sub-keys including `['animals', 'select']`, `['animals', 'cattle']` (non-exact matching).
- **CSS**: Tailwind v4 + heavy custom CSS in `index.css`. Responsive breakpoints at 375px, 480px, 768px, 1024px, 1280px, 1536px, 1920px, 2560px.

#### Completed — Current Session (July 2026): Dashboard+Veterinary+Responsive

- **Phase 1 — Admin Dashboard zero income/expenses**: `getOwnerDashboard()` was querying `supplier_invoices` / `fuel_records` instead of `income_records` / `expense_records`. Rewritten to use accounting tables with `AND deleted_at IS NULL`. ✅
- **Phase 1 — Admin/Accountant dashboard deleted_at**: Added `AND deleted_at IS NULL` to all income/expense SQL in `getAdminDashboard()` and `getAccountantDashboard()`. ✅
- **Phase 2 — Animal Dashboard cattle zero**: Added `LOWER(TRIM(ac.name))` and `AND ac.deleted_at IS NULL` to category-join queries. ✅
- **Phase 3 — "Unknown column 'status'" root cause**: Migration `001_initial_schema.ts:1546-1557` creates `animal_health_records` WITHOUT `status` column, but all 5 backend queries reference it. Column existed only on live DB (manual add). Created migration `015_alter_animal_health_records_status.ts` using `addColumnIfNotExists`. ✅
- **Phase 4 — Vet cache invalidation**: Fixed `['animals-select']` → `['animals', 'select']` in all 4 vet pages (HealthRecords, VetVaccinations, TreatmentRecords, Prescriptions). Added `['animal-dashboard-stats']` invalidation to all vet mutations. ✅
- **Phase 5 — Date handling**: Replaced `.split('T')[0]` on Date objects with safe `toDateStr` helper in all 3 vet edit handlers. Fixed `r.date` → `r.checkup_date` in HealthRecords. ✅
- **Phase 6 — Build verification**: Frontend `vite build` — 0 errors (12.95s). Backend `tsc --noEmit` — 0 errors. ✅
- **Phase 7 — Responsive Audit**: Fixed 22 responsive issues across 15 pages:
  - **Fixed-width modals**: `IncomePage.tsx:159`, `ExpensesPage.tsx:160`, `EmployeeDashboard.tsx:376` — changed `width: 500/480` → `width: '100%', maxWidth: 500/480`
  - **Missing flexWrap**: Added `flexWrap: 'wrap'` to 14 containers across VetDashboard, HealthRecords, TreatmentRecords, VetVaccinations, Prescriptions, CropDashboard, AccountingDashboard, AccountingReports, IncomePage, ExpensesPage
  - **Inline grids**: Added CSS override for `[style*="grid-template-columns:"]` to force 1fr at ≤640px (covers DashboardPage, AnimalRegistration, MilkDashboard, and any other inline grid)
  - **CSS overrides**: Enhanced `.page`, `.modal`, `.card` and bare `[style*="grid-template-columns:"]` selectors. Added MilkDashboard-specific `2fr 1fr` → 1fr override at 768px
- **Phase 8 — Cross-module CRUD validation**: DB-level create+verify+cleanup for all modules:
  - Accounting: Income (500) + Expense (300) → Owner Dashboard (3500 income, 1100 expenses) ✅
  - Animal: Cattle (id 18) + Pig (id 19) → Dashboard (0 total, 6 cattle, 0 pigs after cleanup) ✅
  - Veterinary: Health + Vaccination + Treatment + Prescription → All created and verified ✅
  - All test data cleaned up successfully ✅
- **Production validation**: All 15+ API endpoints tested via HTTP — all return 200 with correct data ✅

### Build Status
- Frontend `vite build`: zero errors (12.95s)
- Backend `tsc --noEmit --skipLibCheck`: zero errors

### Tech Stack
- React + TypeScript + Vite (frontend, port 5173)
- Express + MySQL2 + JWT auth (backend, port 5000)
- TanStack Query, Lucide icons, react-hot-toast
- Tailwind v4 + custom CSS

### Pending
- No pending items

### Files Modified (Current Session)
- `backend/src/controllers/dashboardController.ts` — Owner/Admin/Animal dashboard queries
- `backend/src/database/migrations/015_alter_animal_health_records_status.ts` — new migration
- `backend/src/database/index.ts` — registered migration 015
- `frontend/src/styles/index.css` — responsive overrides, MilkDashboard grid
- `frontend/src/pages/veterinary/VetDashboard.tsx` — flexWrap
- `frontend/src/pages/veterinary/HealthRecords.tsx` — flexWrap × 2
- `frontend/src/pages/veterinary/TreatmentRecords.tsx` — flexWrap × 2
- `frontend/src/pages/veterinary/VetVaccinations.tsx` — flexWrap × 2
- `frontend/src/pages/veterinary/Prescriptions.tsx` — flexWrap × 2
- `frontend/src/pages/crops/CropDashboard.tsx` — flexWrap
- `frontend/src/pages/accounting/AccountingDashboard.tsx` — flexWrap + gap
- `frontend/src/pages/accounting/AccountingReports.tsx` — flexWrap × 2
- `frontend/src/pages/accounting/IncomePage.tsx` — width 500 → maxWidth 500 + flexWrap
- `frontend/src/pages/accounting/ExpensesPage.tsx` — width 500 → maxWidth 500 + flexWrap × 2
- `frontend/src/pages/employee/EmployeeDashboard.tsx` — width 480 → maxWidth 480
