# AGENTS.md

## Project
EFMS — Enterprise Farm Management System. Full-stack React + Vite frontend, Express + MySQL backend.

## Session Context (Last Updated: 2026-08-15)

### Current Objective (Purchase Order contract alignment — resolved)
Fixed the Purchase Orders frontend/backend contract. The frontend sends `{ supplier_id, cost, order_date, expected_delivery, status, notes }`; the backend now validates + persists that payload and returns PO data that matches what `PurchaseOrders.tsx` displays. Scope: `modules.ts` (validator) + `purchaseOrderController.ts` + `PurchaseOrders.tsx`. No schema change, no UI redesign.

- **Validator `createPurchaseOrderSchema`** (`backend/src/validators/modules.ts:292`): now declares `cost: z.number().positive().optional().nullable()` and `status: z.string().optional().nullable()`; `order_date` made `optional().nullable()` (was REQUIRED — frontend sends `undefined` when blank → 400). Kept `request_id`/`expected_delivery`/`items`/`notes` + `.passthrough()`.
- **Backend `createPurchaseOrder`**: destructures + persists `status` (`status || 'pending'`) instead of hardcoded `'pending'` — previously a new PO (status 'draft' from the form) never appeared under the Draft tab since statusMap has no 'pending'. Also `orderDate = order_date || today` — `order_date` is `DATE NOT NULL`, so a blank date previously hit "Column 'order_date' cannot be null".
- **Backend `updatePurchaseOrder`**: `orderDate = order_date || old value (Date-safe) || today` instead of `order_date || null` (NOT NULL constraint).
- **Backend `getPurchaseOrders`**: added `(SELECT GROUP_CONCAT(item_name ...) FROM purchase_order_items WHERE po_id = po.id) as item_name` so the frontend "Name" column has real data (previously undefined).
- **Frontend `PurchaseOrders.tsx` columns**: Name → `o.item_name || o.request_items || '-'`; Payment Method → `o.payment_method || '-'` (was fake `'Cash'` fallback — PO has no payment_method field). Department stays `o.department || '-'`. Cost column unchanged.
- **Note**: `getPurchases` still references `po.department_id` (no such column on `purchase_orders`) — latent SQL error if `/procurement/purchases` is ever called, but it is NOT used by the frontend (PurchaseOrders uses `/procurement/orders`); left untouched per "no unrelated changes".
- **Verified via API (2026-08-15)**: login ruda → POST `/procurement/orders` `{supplier_id:8, cost:150000, order_date, expected_delivery, status:'draft', notes}` → 201 id=13; GET orders shows `status:'draft'`, `total_cost:'150000.00'`, `item_name:null`; PENDING expense id=17 (150000, "Purchase from bonheur"); `PUT /expenses/17/confirm` → 200; double-confirm → 400 "already confirmed". Blank-`order_date` create (no date in body) → 201 id=14 (defaulted to today). Test PO 13/14 + expense 17 deleted afterward.
- **Builds**: backend `tsc --noEmit` EXIT:0; frontend `tsc --noEmit` EXIT:0 + `vite build` OK (46.96s).
- NOTE: Backend port 5000 is running (PID from user's `npm run dev`).

### Previous Objective (RWF currency + PO "Cost" column + Medicine "Grams" — resolved)
Converted all money displays from USD `$` to RWF, reverted the Purchase Orders column to "Cost", and added "Grams" to Medicine Stock units. Frontend-only changes except backend `medicineController` (persist unit) and PO total_cost subquery.

- **Currency → RWF**: `frontend/src/services/currency.ts` is RWF-only (`formatAmount` → `RWF ${n.toLocaleString('en-US', {max 2 decimals})}`, `setCurrency` no-op). Swept ALL hardcoded `$`/bare-number money renders to `RWF ${Number(x).toLocaleString()}` across: sales (ProductsPage price, OrdersPage total + product option, CustomersPage total purchase + product option, SalesInvoices total + order option), procurement (PurchaseOrders Cost, PurchaseRequests Est Cost, ProcurementInvoices amount, ProcurementContracts total_value, ProcurementDashboard total + Total Purchases, ProcurementReports Total Spending + Pending Payments), stock (MedicineStock unit_price, StockReceiving unit_price + total, InventoryPage purchase_price), animals (Treatment cost, AnimalProfile purchase price + cost, AnimalSales price, FeedManagement purchase_price), logistics (FuelPage cost + Total Cost, MaintenancePage cost, LogisticsReports Total Cost + Avg Cost/L), crops (CropReports Value/Amount + CSV headers + Total Sales, CropActivities Sales), milk (MilkCustomers balance, MilkReports revenue, MilkProducts price, MilkProcessing price), veterinary (VetVaccinations cost). Accounting/dashboards/sales reports already used `formatAmount` (now RWF) — no change needed.
- **PO column = "Cost"**: `PurchaseOrders.tsx:110` — `{ key: 'total_cost', label: 'Cost', render: o => RWF ${...} }`. No "Linked Request" column remnants (that string only remains as the create-form "Linked Request" field label). Backend `purchaseOrderController.ts:20,144` adds `total_cost` subquery (sum of `purchase_order_items.total_price`).
- **Medicine "Grams"**: `MedicineStock.tsx:194` added `<option value="grams">Grams</option>` (kept pcs/bottles/vials/ml/tablets/sachets). Backend `medicineController.ts` now persists `unit` on create (`unit || null`) and update (`unit ?? old[0].unit`).
- **Verified**: Frontend `tsc --noEmit` EXIT:0 and `vite build` OK (11.90s). Backend `tsc` changes (medicine unit, PO total_cost) confirmed present.
- NOTE: Backend port 5000 was freed earlier (background backend killed so user can run `npm run dev` themselves); backend may not be running.

### Previous Objective (Login speed — targeted, resolved)
Optimized the login flow so valid logins redirect immediately. Only 2 files changed (frontend-only):

- **`SplashScreen.tsx`**: Removed the hardcoded `setTimeout(..., 3000)` artificial delay after the logo loads — splash now completes the instant the image loads. Added `onError` fallback so a blocked/failed logo (e.g. railway.app upload blocked by ORB/CORS) can NEVER hang the splash and block the app.
- **`LoginPage.tsx`**: Moved the authenticated-user `navigate()` out of the render body into a `useEffect` (fixes a "side effect during render" anti-pattern and duplicate navigation). Added a `loginInFlight` ref guard so clicking Sign In twice cannot fire duplicate `/auth/login` requests.

Verified (browser automation, chromium via playwright skill):
- Login reachable fast (splash no longer waits 3s). ✅
- Valid login redirects to `/dashboard` in ~1.2s (farm_owner); crops user role-redirect works. ✅
- Invalid login shows "Invalid credentials. N attempts remaining." banner + toast. ✅
- Page refresh keeps auth (stays on dashboard, profile endpoint intact). ✅
- Duplicate-submit guarded, no bounce back to login. ✅
- Frontend `tsc --noEmit` and `vite build` both pass. ✅
- Test user passwords restored to original hashes; `failed_attempts` reset; backend hung process was restarted.

Note: The backend process (tsx watch) was hung/unresponsive (port open, no response) and had to be killed and restarted with `npm run dev` in `backend/`. Not related to these frontend changes.

### Accounting pending/confirm workflow (previous session — resolved)
Sales, payroll, and expenses go through a PENDING → CONFIRMED workflow so unconfirmed records do NOT inflate dashboard totals. Confirmed totals = only `status='confirmed'` rows; `pendingIncome`/`pendingExpenses` reported separately. Verified end-to-end via API (2026-08-13):

- **Payroll salary payment** → created `pending`, dashboard pendingExpenses increases but totalMonthlyExpenses does NOT; `PUT /api/accounting/payroll/payments/:id/confirm` moves to confirmed; double-confirm → 400 "already confirmed". ✅
- **Customer sale** (POST /api/sales/customers with product/quantity) → creates `pending` income `source=Sales`, does NOT deduct product stock, does NOT increase confirmed income; `PUT /api/accounting/income/:id/confirm` confirms; double-confirm → 400. ✅
- **Sales order completion** (`PUT /api/sales/orders/:id/status` completed) → creates `pending` income `source=Sales Revenue`. ✅
- **Expense POST** defaults to `status='confirmed'` unless body passes `status:'pending'`; `PUT /api/accounting/expenses/:id/confirm` confirms a pending expense; double-confirm → 400. ✅
- **Migration 019** (`019_alter_customer_payments_invoice_nullable.ts`): made `customer_payments.invoice_id` NULL — the pre-existing dirty `customerController.ts` sale path inserts NULL for invoice_id (NOT NULL column caused HTTP 500 "Column 'invoice_id' cannot be null" on any customer sale). ✅
- **Migration 018** (`018_add_status_to_income_expense.ts`): added `status` to `income_records`/`expense_records`, backfilled existing rows to `confirmed` (no data loss). ✅
- **Test data cleaned up** after verification (customer 18, income 11/12, expenses 9/10, sales_orders 9/10, customer_payment 2, payroll expense 7). Remaining `Test * CRUD` rows are pre-existing.

### Previous Objective (Animal Production — resolved)
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
