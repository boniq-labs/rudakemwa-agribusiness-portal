# EFMS Role Restructuring & Dynamic Dashboard Implementation Plan

## Overview
Restructure the system from admin/worker model to Farm Owner → Department Manager → Employee hierarchy. Use existing role slugs (`animal`, `milk`, `stock`, etc.) as department manager roles. Add employee dashboard and self-service features.

---

## Phase 1: Backend Changes

### 1.1 Seed file — Ensure worker permissions
**File:** `D:\fast\efms\backend\src\config\seed.ts`
- Ensure `worker` role has `attendance.view/create`, `tasks.view`, `profile.view/update`, `notifications.view` permissions
- Make role labels descriptive (e.g., `animal` → `Animal Production Manager`)

### 1.2 Add `getManagers` endpoint
**File:** `D:\fast\efms\backend\src\controllers\userController.ts`
- Add `getManagers` function: queries users with department role slugs (`hr`, `animal`, `milk`, `stock`, `procurement`, `logistics`, `accountant`, `sales`, `veterinarian`)
- Return: id, name, role, department, status, employee_code, position

### 1.3 Add route
**File:** `D:\fast\efms\backend\src\routes\index.ts`
- `router.get('/users/managers', authenticate, hasRole('owner'), getManagers);`

### 1.4 Enhance employee dashboard data
**File:** `D:\fast\efms\backend\src\controllers\dashboardController.ts`
- Enhance `getDefaultDashboard` (worker fallback) to return: today's attendance status, unread notifications, tasks, user profile summary

---

## Phase 2: Frontend Constants & Login

### 2.1 Update constants
**File:** `D:\fast\efms\frontend\src\utils\constants.ts`
- Update `ROLE_LABELS` with manager-friendly names
- Add `DEPARTMENT_ROLES = ['hr','animal','milk','stock','procurement','logistics','accountant','sales','veterinarian']`
- Add `DEPARTMENT_ROLE_ROUTES` map

### 2.2 Update login redirect
**File:** `D:\fast\efms\frontend\src\pages\auth\LoginPage.tsx`
- Change `worker: '/dashboard'` → `worker: '/employee/dashboard'`

---

## Phase 3: New Employee Dashboard

### 3.1 Create employee dashboard page
**File:** `D:\fast\efms\frontend\src\pages\employee\EmployeeDashboard.tsx` (NEW)
- Sections: Profile card, Today's Attendance (check-in/out), My Tasks, Notifications, Quick Links
- Uses: `dashboardApi.get()`, `attendanceAPI` for check-in/out

### 3.2 Add routes
**File:** `D:\fast\efms\frontend\src\App.tsx`
- Lazy import `EmployeeDashboard`
- Add route: `<Route element={<ProtectedRoute roles={['owner', 'admin', 'worker']} />}>` → `/employee/dashboard`

---

## Phase 4: Sidebar Updates

### 4.1 Add employee nav
**File:** `D:\fast\efms\frontend\src\layouts\Sidebar.tsx`
- Add `Employee` nav group for `worker` role with: Dashboard, Profile, Notifications

### 4.2 Verify department manager nav
- Existing role filtering already scopes correctly (e.g., `animal` sees only Dashboard + Animal Production)

---

## Phase 5: HR Employee Creation Fix

### 5.1 Fix role dropdown
**File:** `D:\fast\efms\frontend\src\pages\hr\EmployeesPage.tsx`
- Replace hardcoded `['admin', 'hr', 'manager', 'employee']` with import from constants (filter out `owner`, `admin`)

---

## Phase 6: Farm Owner Dashboard — Department Managers

### 6.1 Add managers section
**File:** `D:\fast\efms\frontend\src\pages\dashboard\DashboardPage.tsx`
- Add "Department Managers" section (owner-only) showing managers grouped by department
- "Add Manager" button opens a modal
- Modal fields: Full Name, Phone, Email, Username (auto), Password (auto), Position, Department, Status
- Uses `usersApi.create()` with the selected department's role slug

### 6.2 Add managers API
**File:** `D:\fast\efms\frontend\src\api\endpoints.ts`
- Add `getManagers` API call

---

## Files Summary

| Action | File |
|--------|------|
| Modify | `backend/src/config/seed.ts` |
| Modify | `backend/src/controllers/userController.ts` |
| Modify | `backend/src/routes/index.ts` |
| Modify | `backend/src/controllers/dashboardController.ts` |
| Modify | `frontend/src/utils/constants.ts` |
| Modify | `frontend/src/pages/auth/LoginPage.tsx` |
| **New** | `frontend/src/pages/employee/EmployeeDashboard.tsx` |
| **New** | `frontend/src/pages/employee/index.ts` |
| Modify | `frontend/src/App.tsx` |
| Modify | `frontend/src/layouts/Sidebar.tsx` |
| Modify | `frontend/src/pages/hr/EmployeesPage.tsx` |
| Modify | `frontend/src/pages/dashboard/DashboardPage.tsx` |
| Modify | `frontend/src/api/endpoints.ts` |

---

## Verification
1. Login as `owner/admin123` → Farm Owner Dashboard → see Department Managers section + all KPIs unchanged
2. Create a Department Manager (Animal Production) → login as new manager → redirected to `/animals/dashboard` → sidebar shows only Dashboard + Animal Production
3. Login as `admin/rdkmw@` → can still access everything (backward compat)
4. HR creates Employee with role `worker` → login as employee → redirected to `/employee/dashboard` → see profile, attendance, tasks, notifications
5. Employee can check-in/check-out from dashboard
