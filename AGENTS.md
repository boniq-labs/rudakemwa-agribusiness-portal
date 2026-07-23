# AGENTS.md

## Project
EFMS — Enterprise Farm Management System. Full-stack React + Vite frontend, Express + MySQL backend.

## Session Context (Last Updated: 2026-07-22)

### Objective
- **Stability audit & crash fixes**: eliminate 429 login lockouts, white screens on corrupted localStorage, silent server crashes (EADDRINUSE, unhandled promise rejections), and masked login errors.
- Dynamic system settings & shift management for Farm Owner / Animal Production Manager.
- Fix Employee Dashboard: real attendance, real activities, real profile, safe date formatting, shift integration, cross-department access.

### Important Details
- **Collector dropdown permanently replaced**: unreliable employee selector removed; `collector_name` plain-text input used for both Morning + Evening Production.
- **`collector_name` column added** to `milk_collections` via migration (ALTER TABLE); migration auto-runs on server start via `server.ts` async IIFE awaiting `migrate()` before `listen()`.
- **Schema accepts both** `collector_name` (preferred) and `collector_id` (backward compat with `MilkCollection.tsx`); refined with `.refine(data => data.collector_name || data.collector_id)`.
- **`GET /animals/select`** (new endpoint) returns only active non-deleted non-dead non-sold animals for dropdown use.
- **Dead/sold animals never set `deleted_at`** — `createAnimalSale` and `createAnimalDeath` only set `status='sold'`/`status='dead'`, leaving `deleted_at=NULL`.
- **owner role** bypasses all `authorize()` checks via `isSuperAdmin`.
- **No `dateStrings: true`** in DB pool config — MySQL2 returns DATE/DATETIME as Date objects.
- **`attendance` table** originally had `check_in TIME`, `check_out TIME` (not DATETIME), no `user_id`, no `total_hours`, and `overtime_minutes` column name was `overtime` in controller — all fixed via ALTER.
- **`employee_activities` table** was missing from migrate.ts entirely — only defined in a manual script (`create_tables.js`) that was never executed on server start. Added to migrate.ts with full CREATE TABLE.
- **Employee Dashboard** route was restricted to `['owner', 'admin', 'worker']` — expanded to all department roles so every employee can access their self-service dashboard.

### Work State
#### Completed
- **Milk Production — Collector selector replaced**: text input replaces employee `<select>`.
- **Milk Production — Save button root cause fixed**: migration auto-runs on start, `collector_name` column exists, schema validates, controller uses COALESCE for backward compat, frontend shows real server errors.
- **Crop Reports — Date filtering**: per-column date filters (harvest_date, created_at, planting_date).
- **Veterinary / Animal — Animal data sync**: `GET /animals/select` endpoint filters out dead/sold; all 13 dropdown pages updated.
- **Dynamic Settings**: `app_settings` table + `settingsController.ts` (GET/PUT) + `UploadController.ts` + SettingsPage with system name, farm name, logo, favicon, address, phone, email, system_info. Sidebar, LoginPage, SplashScreen all use dynamic values.
- **Profile Photo**: `updateProfile` now accepts `photo`; ProfilePage has camera upload button.
- **Shift Management**: `employee_shifts` table + `shiftController.ts` (CRUD + my-shift) + ShiftManagement.tsx page + sidebar link. Animal Production Manager can assign shifts; employees see today's shift on dashboard.
- **Shift Notification**: AppLayout checks `GET /shifts/my-shift` on mount and shows toast for non-owner/non-admin users.
- **Employee Dashboard — All departments**: route guard expanded from `['owner', 'admin', 'worker']` to all department roles (`animal`, `milk`, `veterinarian`, `procurement`, `logistics`, `stock`, `sales`, `accountant`, `crops`, `hr`). Sidebar updated accordingly.
- **Employee Dashboard — Safe date formatting**: `safeTime()`, `safeDate()`, `safeDateTime()` helpers prevent "Invalid Date" by checking `isNaN(d.getTime())` and handling bare `HH:MM` strings from MySQL TIME columns.
- **Employee Dashboard — Today's Shift card**: shows department, shift name, time range when `GET /shifts/my-shift` returns a shift with `today: true`.
- **Employee Dashboard — Real attendance data**: `GET /attendance/today` returns actual DB record; check-in/check-out buttons work against real backend.
- **Employee Dashboard — Real activities**: `GET /activities/my` returns DB records sorted newest first; no fake data.
- **Employee Dashboard — Real notifications**: `GET /notifications` returns real records; shows "No notifications" when empty.
- **Database fixes — migrate.ts**: added `employee_activities` table creation; ALTER statements for `attendance.user_id`, `attendance.total_hours`, `attendance.check_in DATETIME`, `attendance.check_out DATETIME`.
- **Database fixes — controller**: `attendanceController.ts` now writes `overtime_minutes` (not `overtime`) matching the actual column name.

### 2026-07-22 — Stability & Crash Audit
- **429 rate limit root cause fixed**: `server.ts:31` authLimiter `max:20→50` + `skipSuccessfulRequests:true` so only failed attempts consume quota.
- **Login error masking fixed**: `LoginPage.tsx:64` — added `err.message` to fallback chain so thrown `Error` objects display their message instead of generic "Login failed".
- **401 interceptor login guard**: `client.ts:24` — added `!original.url?.includes('/auth/login')` to prevent redirect-to-login on failed login POSTs.
- **Server crash on async IIFE**: `server.ts:57-63` — `migrate()` call had no `.catch()`, causing unhandled promise rejection (Node v15+ terminates process). Wrapped in try/catch.
- **Server crash on EADDRINUSE**: `server.ts:59` — `httpServer.listen()` had no `'error'` handler. Added `httpServer.on('error')` logging port conflict + `process.exit(1)`.
- **AuthContext white screen**: `AuthContext.tsx:27-28` — `JSON.parse(s)` on corrupted localStorage data caused uncaught error on mount, rendering white screen. Wrapped in try/catch returning `null`.
- **Full audit**: Frontend build ✅ (zero errors), all 66 backend controllers ✅ (try/catch present), no infinite loops ✅, no duplicate requests ✅, database schema valid ✅.

#### Active
- (none)

#### Blocked
- (none)

### Next Move
Restart both servers (`npm run dev` in backend + frontend) and verify login flow works without 429 or crash after all fixes.

### Key Files
- `migrate.ts` — `employee_activities` CREATE TABLE (after employee_shifts); ALTER TABLE for attendance columns (user_id, total_hours, check_in/out DATETIME)
- `attendanceController.ts` — `overtime` → `overtime_minutes` fix in both `employeeCheckOut` and `checkOut`
- `routes/index.ts:322-330` — `/users/me` returns `e.position` via LEFT JOIN employees
- `frontend/src/App.tsx:302-304` — Employee Dashboard route now open to all department roles
- `frontend/src/layouts/Sidebar.tsx` — Employee nav item open to all roles
- `frontend/src/pages/employee/EmployeeDashboard.tsx` — safe date formatting helpers, shift card, cross-dept profile data
- `backend/src/server.ts:28,31,54-67` — authLimiter max:50+skipSuccessfulRequests, httpServer.on('error'), async IIFE try/catch
- `frontend/src/pages/auth/LoginPage.tsx:64` — err.message fallback in error chain
- `frontend/src/api/client.ts:24` — 401 interceptor guard for /auth/login
- `frontend/src/contexts/AuthContext.tsx:27-32` — JSON.parse try/catch for localStorage corruption
