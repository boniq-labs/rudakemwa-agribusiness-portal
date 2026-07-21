# Enterprise Farm Management System (EFMS) — User & Operations Guide

A complete, multi-department farm management platform covering HR, Animal Production,
Milk Production, Stock, Procurement, Logistics, Accounting, Sales, and Veterinary services
with role-based access control (RBAC), real-time updates, audit logging, multi-language,
multi-currency, and dark mode.

---

## 1. What EFMS Is

EFMS is a web application used to run an entire farm (dairy, livestock, poultry, or mixed)
from one dashboard. Different staff members log in with role-specific accounts and only see
the modules they are permitted to use.

**Stack**
- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS + TanStack Query + Recharts
- **Backend:** Node.js + Express + TypeScript (tsx) + MySQL (mysql2) + Socket.io
- **Security:** JWT auth, bcrypt password hashing, Helmet, rate limiting, Zod validation, audit logging
- **Real-time:** Socket.io (live notifications, dashboards)
- **i18n:** English / Kinyarwanda / French
- **Reusable:** Docker Compose for MySQL + backend + frontend

---

## 2. How to Run the System

### 2.1 Prerequisites
- Node.js 18+
- MySQL 8.0 server running locally (or Docker)
- (Optional) Docker Desktop for one-command deployment

### 2.2 Default local ports
| Service   | URL                       |
|-----------|---------------------------|
| Backend   | http://localhost:5000     |
| Frontend  | http://localhost:5173     |

### 2.3 First-time setup (manual)
From the project root `D:\fast\efms`:

```powershell
# 1. Backend
cd backend
npm install
cp .env .env.local        # (optional) adjust DB credentials

# Create the database + ~100 tables and seed default data
npm run db:push           # runs src/config/migrate.ts
npm run db:seed           # runs src/config/seed.ts  (creates owner/admin, roles, permissions, departments)

# Start backend (hot reload)
npm run dev               # http://localhost:5000

# 2. Frontend (new terminal)
cd ../frontend
npm install
npm run dev               # http://localhost:5173
```

> The frontend dev server is configured to proxy `/api` requests to the backend on port 5000,
> so you only ever browse **http://localhost:5173**.

### 2.4 Docker (one command)
```powershell
docker-compose up --build
```
This starts MySQL (port 3307), backend (5000), and frontend (5173). On first run, connect to
the backend container and run `npm run db:push && npm run db:seed` once.

### 2.5 Production build
```powershell
# Backend
cd backend && npm run build && npm start

# Frontend
cd frontend && npm run build && npm run preview
```

---

## 3. Logging In

1. Open **http://localhost:5173**.
2. You land on the **Sign In** page.
3. Enter your credentials and click **Sign In**.

If you are already logged in and reopen the app, it auto-restores your session from
`localStorage` (or `sessionStorage` if you unchecked "Remember me").

### 3.1 Default accounts
Created by the seed script:

| Username | Password   | Role            | Access                                  |
|----------|------------|-----------------|-----------------------------------------|
| `owner`  | `admin123` | Farm Owner      | Full access to everything (super admin)|
| `admin`  | `admin123` | System Admin    | Users, reports, settings, branches, documents, dashboard |
| (others) | —          | department roles| scoped to their module (see §5)         |

> The **owner** role bypasses all permission checks. Use it for first setup, then create
> dedicated staff accounts under **Users**.

### 3.2 Login options
- **Remember me** (checked by default): keeps you signed in across browser restarts via `localStorage`.
- **Unchecked**: session lasts only until the browser tab is closed (`sessionStorage`).

### 3.3 Lockout protection
After **5 failed attempts** the account is locked for **15 minutes**. The login form shows the
remaining lock time.

### 3.4 First actions after login (as owner)
1. Go to **Users** → create accounts for your staff, assign each a **Role**.
2. Go to **HR → Departments / Positions** → define your org structure.
3. (Optional) Go to **Settings** to configure currency, language, and company profile.

---

## 4. The Interface

### 4.1 Layout
- **Left sidebar** — module navigation. Items are filtered automatically by your role.
- **Top bar** — global search, dark-mode toggle, notifications bell, and your profile menu.
- **Main content** — the active module's page.

### 4.2 Top bar features
- **Search** — quick lookup of employees, animals, invoices (global search bar).
- **Dark / Light mode** — click the moon/sun icon. Choice is stored in `localStorage`.
- **Notifications** — bell icon shows unread count; dropdown lists the latest 5 and a
  "Mark all read" action. Notifications refresh every 30 seconds and arrive live via Socket.io.
- **Profile menu** — "My Profile", "Settings", "Help", and **Logout**.

### 4.3 Sidebar
- Click a top-level item to expand its sub-menu (e.g., **Animal Production → Breeding Management**).
- The collapse arrow (top of sidebar) hides labels for a compact view.
- Your name, initials avatar, and role appear at the bottom with the **Logout** button.

### 4.4 Languages
Switch UI language with `setLanguage()` (EN / RW / FR). The active language is saved in
`localStorage` under the key `lang`. Translations cover navigation, common buttons, auth, and
dashboard labels. (Extended translation keys can be added in `frontend/src/services/i18n.ts`.)

---

## 5. Roles & Permissions (RBAC)

Every action is gated by a permission slug of the form `module.action`
(e.g. `animals.create`, `finance.approve`). There are **58 modules** × 6 actions
(`view, create, update, delete, approve, export`).

### Roles seeded by the system
| Role slug       | Name                     | Sees / can use                                  |
|-----------------|--------------------------|-------------------------------------------------|
| `owner`         | Farm Owner               | Everything (all permissions)                    |
| `admin`         | System Administrator     | Users, reports, settings, branches, documents, dashboard |
| `hr`            | HR Officer               | HR module (employees, attendance, leave, recruitment, contracts, training, performance, documents) |
| `accountant`    | Accountant               | Finance (income, expenses, invoices, payroll, budgets, reports) |
| `animal`        | Animal Production Officer| Animals, breeding, health, vaccination, feeding, weight |
| `veterinarian`  | Veterinarian             | Animals, health, vaccination, treatment, veterinary |
| `milk`          | Milk Production Officer  | Milk collection, quality, storage, processing   |
| `procurement`   | Procurement Officer      | Suppliers, purchase requests, purchase orders   |
| `logistics`     | Logistics Officer        | Vehicles, drivers, transport, trips, fuel       |
| `stock`         | Stock Manager            | Inventory, feed, medicine, equipment            |
| `sales`         | Sales Officer            | Customers, products, orders, sales invoices     |
| `worker`        | Worker                   | Notifications only                              |

> A non-owner user who navigates to a page outside their permissions sees an **"Access Denied"**
> message. The sidebar only shows modules they can access.

The **owner** and **admin** roles also see the **Users** and **Settings** top-level items.

---

## 6. Module-by-Module Guide

Below is every screen available and what you do there. Paths are shown as `sidebar → sub-item`.

### 6.1 Dashboard (all roles)
`Dashboard`
- Role-aware landing page with KPI cards: total employees, total animals, milk today,
  monthly income, monthly expenses, profit.
- Live charts (Recharts). Data refreshes in real time via Socket.io.

### 6.2 Users (owner, admin) — `Users`
- List all system users with role, department, status.
- **Create / Edit / Delete / Reset password** for accounts.
- Assign a role and department to each user.
- (This is how you onboard new staff — they then log in with their own credentials.)

### 6.3 HR (owner, admin, hr)
`HR →`
- **Dashboard** — HR metrics (headcount, attendance rate, pending leaves, open recruitments).
- **Employees** — full employee directory; add, edit, terminate; view per-employee profile.
- **Departments** — create/edit organizational departments.
- **Positions** — job positions within departments.
- **Attendance** — check-in / check-out records; daily and periodic attendance reports.
- **Leave Management** — leave types, leave requests, approve/reject, cancel.
- **Recruitment** — job postings (recruitment jobs), applicants, status workflow.
- **Contracts** — employment contracts, terminate, view expiring contracts.
- **Training** — training programs, enroll participants, track progress.
- **Performance** — performance reviews (create/update).
- **Documents** — HR document storage (uploads via multer).
- **Payroll Info** — read-only payroll summaries for employees.
- **Reports** — aggregated HR reports (exportable).

### 6.4 Animal Production (owner, admin, animal, veterinarian)
`Animal Production →`
- **Dashboard** — herd size, births, deaths, health alerts.
- **Animal Registration** — register new animals (tag, category, breed, sex, birth date, etc.).
- **Categories** — animal categories (e.g., cattle, goat, poultry).
- **Breeds** — breed definitions.
- **Animal Groups** — grouping animals for management.
- **Animal Profile** — detailed view of a single animal's lifecycle.
- **Breeding Management** — breeding records.
- **Pregnancy Tracking** — pregnancies, status updates.
- **Birth Records** — birth events.
- **Feeding Management** — feeding schedules/records + feeding report.
- **Weight Tracking** — periodic weight logs.
- **Vaccination** — vaccination schedule/records.
- **Disease Management** — disease cases and status.
- **Treatment Records** — treatments administered.
- **Animal Transfer** — move animals between locations.
- **Animal Purchase** — record purchased animals.
- **Animal Sale** — record sold animals.
- **Animal Death** — record deaths (with reason).
- **Reports** — animal production reports (exportable).

### 6.5 Milk Production (owner, admin, milk)
`Milk →`
- **Dashboard** — today's collection, quality trend, storage levels.
- **Milk Collection** — record collections (morning/evening, per animal/group, volume, fat/SNF).
- **Morning Production** — morning session collections.
- **Evening Production** — evening session collections.
- **Milk Quality** — quality tests (e.g., butterfat, protein, somatic cell count).
- **Storage Management** — storage tanks, add-to-storage transactions.
- **Milk Processing** — processing batches into products.
- **Milk Products** — finished product catalog.
- **Customers** — milk/bulk customers.
- **Milk Waste** — waste/spoilage records.
- **Daily Reports** — dairy daily reports.

### 6.6 Stock Management (owner, admin, stock)
`Stock Management →`
- **Dashboard** — inventory value, low-stock alerts, item counts.
- **Inventory** — master inventory items.
- **Feed Stock** — animal feed inventory + consumption tracking + report.
- **Medicine Stock** — medicines, expiry tracking (expiring/expired views).
- **Equipment Stock** — equipment, condition, maintenance records.
- **Categories** — stock item categories.
- **Suppliers** — stock suppliers + ratings.
- **Stock Receiving** — receive goods into inventory.
- **Stock Issue** — issue items out.
- **Stock Transfer** — move stock between locations.
- **Stock Adjustment** — manual adjustments (loss/damage/correction).
- **Reports** — inventory valuation and movement reports.

### 6.7 Procurement (owner, admin, procurement)
`Procurement →`
- **Dashboard** — spend, pending orders, supplier count.
- **Suppliers** — supplier directory + categories + ratings.
- **Purchase Requests** — internal requests; create/approve/reject.
- **Quotations** — supplier quotations.
- **Purchase Orders** — POs; update status; receive goods.
- **Goods Receiving** — receive ordered goods.
- **Invoices** — supplier invoices; pay.
- **Contracts** — procurement contracts; view expiring.
- **Reports** — procurement spend reports.

### 6.8 Logistics (owner, admin, logistics)
`Logistics →`
- **Dashboard** — fleet status, active trips, fuel usage.
- **Transport Requests** — requests; approve/reject.
- **Vehicles** — vehicle fleet + types; maintenance history.
- **Drivers** — driver directory.
- **Trips** — trip planning and status updates.
- **Deliveries** — delivery tracking.
- **Fuel Management** — fuel logs per vehicle.
- **Maintenance** — vehicle maintenance records + due-maintenance view.
- **Reports** — logistics reports.

### 6.9 Accounting / Finance (owner, admin, accountant)
`Accounting →`
- **Dashboard** — financial snapshot.
- **Income** — record income; summaries.
- **Expenses** — expense categories + expenses; summaries.
- **Invoices** — accounting invoices; status + pay.
- **Payroll** — payroll runs; process.
- **Budgets** — budgets; status updates; budget vs actual.
- **Cash Flow** — cash-flow statement.
- **Profit & Loss** — P&L report.
- **Reports** — financial reports.

### 6.10 Sales (owner, admin, sales)
`Sales →`
- **Dashboard** — sales metrics.
- **Customers** — customer directory.
- **Products** — product catalog + stock updates.
- **Orders** — sales orders; status updates; quotations → order conversion.
- **Invoices** — sales invoices; payment.
- **Deliveries** — sales deliveries.
- **Returns** — product returns.
- **Reports** — sales reports.

### 6.11 Veterinary (owner, admin, veterinarian)
`Veterinary →`
- **Dashboard** — animal health overview.
- **Health Records** — clinical health records.
- **Vaccinations** — vaccination schedule + due-vaccination view.
- **Treatment Records** — treatments.
- **Prescriptions** — prescriptions.

### 6.12 Settings (owner, admin) — `Settings`
- Company profile, application settings, language, currency, and reference/branch data
  (`branches` module). (UI surface depends on build; backend supports branches, documents,
  and notifications modules.)

---

## 7. Cross-Cutting Features

- **Real-time (Socket.io):** dashboards and notifications update live without refreshing.
- **Audit logging:** key actions (login, logout, password change, and module changes) are
  recorded in `activity_logs` for traceability.
- **Pagination & filtering:** list screens support search, pagination, and filters.
- **Export:** many report/list screens support CSV/print export (where the permission
  `*.export` is granted).
- **File uploads:** documents and attachments are stored under the backend `uploads/` folder
  (max 5 MB by default, configured via `MAX_FILE_SIZE`).
- **Cron jobs:** scheduled backend tasks (e.g., periodic jobs) run automatically.
- **Email:** SMTP integration via Nodemailer is wired for notifications/alerts (configure
  `SMTP_*` env vars in production).
- **Multi-currency:** the system is built to handle multiple currencies (configure in settings).

---

## 8. API Reference (for integrators)

Base URL: `http://localhost:5000/api` (proxied at the frontend as `/api`).

**Auth**
- `POST /auth/login` — `{ username, password }` → `{ token, refreshToken, user }`
- `POST /auth/refresh` — `{ refreshToken }` → new tokens
- `GET  /auth/profile` — current user (requires `Authorization: Bearer <token>`)
- `POST /auth/change-password` — `{ currentPassword, newPassword }`
- `POST /auth/logout`

All other endpoints follow RESTful patterns, e.g.:
- `/users`, `/hr/employees`, `/animals`, `/milk/collections`, `/stock/items`,
  `/procurement/orders`, `/logistics/vehicles`, `/accounting/income`, `/sales/orders`,
  `/veterinary/health-records`, etc.
- Standard verbs: `GET` (list/by id), `POST` (create), `PUT` (update), `DELETE` (remove),
  plus action sub-routes like `/:id/approve`, `/:id/pay`, `/:id/receive`.

Every response is wrapped as `{ success, message, data }`. Errors return HTTP status codes
(400/401/403/404/500) with a message. Rate limiting and Helmet headers protect the API.

---

## 9. Environment Configuration (backend `.env`)

| Variable                | Default                       | Purpose                          |
|-------------------------|-------------------------------|----------------------------------|
| `DB_HOST` / `DB_USER` / `DB_PASSWORD` | localhost / root / (empty) | MySQL connection          |
| `DATABASE_URL`          | `mysql://root:@localhost:3306/efms` | Connection string         |
| `JWT_SECRET`            | `efms_jwt_secret_key_2024`    | Access-token signing             |
| `JWT_REFRESH_SECRET`    | `efms_refresh_secret_key_2024`| Refresh-token signing            |
| `JWT_EXPIRES_IN`        | `1h`                          | Access token lifetime            |
| `JWT_REFRESH_EXPIRES_IN`| `7d`                          | Refresh token lifetime           |
| `PORT`                  | `5000`                        | Backend port                     |
| `FRONTEND_URL`          | `http://localhost:5173`       | CORS allow-list                  |
| `UPLOAD_DIR`            | `./uploads`                   | File upload location             |
| `MAX_FILE_SIZE`         | `5242880` (5 MB)              | Max upload size                  |

> Change the JWT secrets in production. Add `SMTP_*` variables to enable email.

---

## 10. Troubleshooting

**Blank page at localhost:5173**
- Clear the corrupted auth state: in the browser devtools console run
  `localStorage.clear(); sessionStorage.clear();` then hard-refresh (`Ctrl+Shift+R`).
- This usually happens after a bad token/`user` value was stored.

**"Internal server error" on login**
- Ensure the backend is running and the DB is migrated + seeded.
- Restart the backend after code changes: in `backend/` stop `npm run dev` and run it again.
- Check `backend/be.log` for the real error (the UI hides details unless `NODE_ENV=development`).

**Login returns success but stays on the login page**
- This was caused by the frontend reading the token from the wrong response level.
  Make sure `frontend/src/contexts/AuthContext.tsx` reads `res.data.data.token`
  (the backend wraps payloads under `data`). Hard-refresh after any fix.

**Curl test returns a JSON parse error**
- PowerShell mangles inline JSON. Use a body file:
  `curl.exe -X POST -H "Content-Type: application/json" --data-binary "@login_body.json" http://localhost:5000/api/auth/login`

**Port already in use**
- Kill the old Node process or change `PORT` in `.env` (and update the Vite proxy target).

**Changes not appearing in the browser**
- Hard-refresh (`Ctrl+Shift+R`) to clear Vite's module cache after editing frontend files.

---

## 11. Quick Start Checklist

1. `backend`: `npm install` → `npm run db:push` → `npm run db:seed` → `npm run dev`
2. `frontend`: `npm install` → `npm run dev`
3. Open http://localhost:5173
4. Sign in with **owner / admin123**
5. Create staff users (Users) and assign roles
6. Explore each module from the sidebar

---

*Generated as the EFMS user/operations manual. For code-level details see the source under
`backend/src` (controllers, routes, services, validators) and `frontend/src` (pages, contexts,
api, layouts).*
