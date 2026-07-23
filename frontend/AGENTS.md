# AGENTS.md – Anchored Summary

## Project: EFMS (Enterprise Farm Management System)

### Session Focus: Bug-fixing Milk Production, Stock Management, Stock Reports, Logistics, Procurement

#### Important Details
- **No `dateStrings: true`** in DB pool config — MySQL2 returns DATE/DATETIME as Date objects. `.substring(0,10)` or `.split('T')[0]` on Date objects throws TypeError, crashing `openEdit` modals silently.
- **Permissions bypass**: `owner` role bypasses all `authorize()` checks via `isSuperAdmin`. Non-owner roles may fail silently on operations requiring specific permissions if frontend lacks `onError` toast handlers.
- **Validation middleware**: `POST` routes use `validate(schema)` which rejects requests with `400` if body fields don't match schema field names.
- **Build strictness**: Backend `tsc` no strict mode, `allowJs: true`. Frontend uses Vite with TypeScript.

#### Completed — Milk Production & Stock Management
- **Milk Collectors**: Collector select changed from `/users?is_active=1` to dedicated `GET /milk/collectors` — queries users with employee JOIN.
- **Morning/Evening Production**: `openEdit` now strips `id` from PUT payload (`id: undefined`) to avoid SQL error.
- **Milk Products**: Backend auto-generates `code` when not provided (`MP-{timestamp}-{random}`); `quantity` added to INSERT/UPDATE.
- **Stock Medicine**: Added `deleteMedicine` controller + DELETE route; frontend payload resolves `category_id` → name string before sending.
- **Stock Categories**: Added `deleteInventoryCategory` controller + DELETE route.
- **Stock Transfer History**: `getStockMovements` uses `LEFT JOIN stock_locations` with `COALESCE(sl.name, st.from_location_id)` to resolve location IDs to names.
- **Stock Adjustment History**: Stores adjustment data as `JSON.stringify({reason, previous_quantity, new_quantity, notes})` in `notes` column.

#### Completed — Stock Reports
- **Inventory Report**: Uses `category_name` column for grouping.
- **Movement Report**: Uses `created_at` with `.toLocaleDateString()` for date formatting.
- **Medicine/Equipment Reports**: Uses correct column names (`brand`, `category`, `model`, `item_condition`).
- **Export CSV**: Keys aligned to DB column names.

#### Completed — Logistics
- **Maintenance Edit**: Added `toDateStr()` helper to safely convert Date/string to YYYY-MM-DD — fixes `item.date.substring(0,10)` TypeError crash on `openEdit`. Backend UPDATE now preserves existing `service_provider` when column may not be in table.
- **Transport Requests**: Added `onSuccess` toast + `onError` handler to approve/reject mutations (were silent). Frontend now sends `rejection_reason` (was `reason`) matching backend expectation.
- **Add Vehicle**: Validation schema `createVehicleSchema` now requires `name` instead of `vehicle_name` — matches frontend payload field.
- **Column display fixes**: `department_name`, `type_name`, `vehicle_name`, `driver_name`, `trip_number`/`trip_destination` fixed across pages.
- **Backend routes**: DELETE `/logistics/requests/:id`, PUT/DELETE `/logistics/maintenance/:id`.

#### Completed — Procurement
- **Contracts Edit**: Backend `updateProcurementContract` uses `status ?? old[0].status` to preserve existing status when frontend doesn't send it.
- **Invoices Edit**: Added `toDateStr()` helper — fixes `item.due_date.substring(0,10)` TypeError crash on `openEdit`.
- **Contracts Edit**: Added `toDateStr()` helper — fixes `contract.start_date.split('T')[0]` TypeError crash on `openEdit`.
- **Backend routes**: PUT/DELETE `/procurement/invoices/:id`, DELETE `/procurement/contracts/:id`.
- **Purchase Requests**: Added `status` to `handleSubmit` payload.

### Build Status
- Frontend `vite build`: zero errors
- Backend `tsc --noEmit`: zero errors

### Tech Stack
- React + TypeScript + Vite (frontend, port 5173)
- Express + MySQL2 + JWT auth (backend, port 5000)
- TanStack Query, Lucide icons, react-hot-toast
- Tailwind v4

### Pending
- No pending items
