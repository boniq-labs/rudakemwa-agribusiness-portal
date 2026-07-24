import mysql from 'mysql2/promise';
import { addColumnIfNotExists } from '../migrationHelpers';

export const name = '010_alter_logistics_accounting';

export async function up(conn: mysql.Connection): Promise<void> {

  // ==========================
  // Trips
  // ==========================
  await addColumnIfNotExists(
    conn,
    'trips',
    'destination',
    `TEXT AFTER \`notes\``
  );

  await addColumnIfNotExists(
    conn,
    'trips',
    'purpose',
    `TEXT AFTER \`destination\``
  );

  await addColumnIfNotExists(
    conn,
    'trips',
    'fuel_used',
    `DECIMAL(10,2) AFTER \`distance_km\``
  );

  await addColumnIfNotExists(
    conn,
    'trips',
    'deleted_at',
    `TIMESTAMP NULL AFTER \`updated_at\``
  );


  // ==========================
  // Deliveries
  // ==========================
  await addColumnIfNotExists(
    conn,
    'deliveries',
    'item',
    `VARCHAR(200) AFTER \`delivery_number\``
  );

  await addColumnIfNotExists(
    conn,
    'deliveries',
    'quantity',
    `DECIMAL(10,2) AFTER \`item\``
  );

  await addColumnIfNotExists(
    conn,
    'deliveries',
    'recipient',
    `VARCHAR(200) AFTER \`quantity\``
  );

  await addColumnIfNotExists(
    conn,
    'deliveries',
    'deleted_at',
    `TIMESTAMP NULL AFTER \`updated_at\``
  );


  // ==========================
  // Transport Requests
  // ==========================
  await addColumnIfNotExists(
    conn,
    'transport_requests',
    'rejection_reason',
    `TEXT AFTER \`status\``
  );

  await addColumnIfNotExists(
    conn,
    'transport_requests',
    'approved_by',
    `INT AFTER \`rejection_reason\``
  );

  await addColumnIfNotExists(
    conn,
    'transport_requests',
    'approved_at',
    `TIMESTAMP NULL AFTER \`approved_by\``
  );

  await addColumnIfNotExists(
    conn,
    'transport_requests',
    'deleted_at',
    `TIMESTAMP NULL AFTER \`updated_at\``
  );


  // ==========================
  // Fuel Records
  // ==========================
  await addColumnIfNotExists(
    conn,
    'fuel_records',
    'deleted_at',
    `TIMESTAMP NULL AFTER \`created_at\``
  );


  // ==========================
  // Vehicle Maintenance
  // ==========================
  await addColumnIfNotExists(
    conn,
    'vehicle_maintenance',
    'deleted_at',
    `TIMESTAMP NULL AFTER \`updated_at\``
  );


  // ==========================
  // Sales Invoices
  // ==========================
  await addColumnIfNotExists(
    conn,
    'sales_invoices',
    'deleted_at',
    `TIMESTAMP NULL AFTER \`updated_at\``
  );

  await addColumnIfNotExists(
    conn,
    'sales_invoices',
    'invoice_date',
    `DATE AFTER \`total_amount\``
  );


  // ==========================
  // Invoices
  // ==========================
  await addColumnIfNotExists(
    conn,
    'invoices',
    'deleted_at',
    `TIMESTAMP NULL AFTER \`updated_at\``
  );


  // ==========================
  // Income Records
  // ==========================
  await addColumnIfNotExists(
    conn,
    'income_records',
    'deleted_at',
    `TIMESTAMP NULL AFTER \`created_at\``
  );


  // ==========================
  // Expense Records
  // ==========================
  await addColumnIfNotExists(
    conn,
    'expense_records',
    'deleted_at',
    `TIMESTAMP NULL AFTER \`created_at\``
  );


  // ==========================
  // Treatments
  // ==========================
  await addColumnIfNotExists(
    conn,
    'treatments',
    'diagnosis',
    `TEXT AFTER \`animal_id\``
  );


  await addColumnIfNotExists(
    conn,
    'treatments',
    'treatment_description',
    `TEXT AFTER \`medicine\``
  );


  await addColumnIfNotExists(
    conn,
    'treatments',
    'treatment_date',
    `DATE AFTER \`treatment_description\``
  );


  await addColumnIfNotExists(
    conn,
    'treatments',
    'follow_up_date',
    `DATE AFTER \`treatment_date\``
  );


  await addColumnIfNotExists(
    conn,
    'treatments',
    'veterinarian_name',
    `VARCHAR(200) AFTER \`dosage\``
  );

}