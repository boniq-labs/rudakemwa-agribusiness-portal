import mysql from 'mysql2/promise';
import { addColumnIfNotExists, modifyColumn } from '../migrationHelpers';

export const name = '010_alter_logistics_accounting';

export async function up(conn: mysql.Connection): Promise<void> {
  // Trips
  await addColumnIfNotExists(conn, 'trips', 'destination', `TEXT AFTER \`notes\``);
  await addColumnIfNotExists(conn, 'trips', 'purpose', `TEXT AFTER \`destination\``);
  await addColumnIfNotExists(conn, 'trips', 'fuel_used', `DECIMAL(10,2) AFTER \`distance_km\``);
  await addColumnIfNotExists(conn, 'trips', 'deleted_at', `TIMESTAMP NULL AFTER \`updated_at\``);

  // Deliveries
  await addColumnIfNotExists(conn, 'deliveries', 'item', `VARCHAR(200) AFTER \`delivery_number\``);
  await addColumnIfNotExists(conn, 'deliveries', 'quantity', `DECIMAL(10,2) AFTER \`item\``);
  await addColumnIfNotExists(conn, 'deliveries', 'recipient', `VARCHAR(200) AFTER \`quantity\``);
  await addColumnIfNotExists(conn, 'deliveries', 'deleted_at', `TIMESTAMP NULL AFTER \`updated_at\``);

  // Transport requests
  await addColumnIfNotExists(conn, 'transport_requests', 'rejection_reason', `TEXT AFTER \`status\``);
  await addColumnIfNotExists(conn, 'transport_requests', 'approved_by', `INT AFTER \`rejection_reason\``);
  await addColumnIfNotExists(conn, 'transport_requests', 'approved_at', `TIMESTAMP NULL AFTER \`approved_by\``);
  await addColumnIfNotExists(conn, 'transport_requests', 'deleted_at', `TIMESTAMP NULL AFTER \`updated_at\``);

  // Fuel records
  await addColumnIfNotExists(conn, 'fuel_records', 'deleted_at', `TIMESTAMP NULL AFTER \`created_at\``);

  // Vehicle maintenance
  await addColumnIfNotExists(conn, 'vehicle_maintenance', 'deleted_at', `TIMESTAMP NULL AFTER \`updated_at\``);

  // SAFE: IF NOT EXISTS additions (MySQL 8.0+)
  await conn.query(`ALTER TABLE sales_invoices ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL AFTER updated_at`);
  await conn.query(`ALTER TABLE sales_invoices ADD COLUMN IF NOT EXISTS invoice_date DATE AFTER total_amount`);
  await conn.query(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL AFTER updated_at`);
  await conn.query(`ALTER TABLE income_records ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL AFTER created_at`);
  await conn.query(`ALTER TABLE expense_records ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL AFTER created_at`);
  await conn.query(`ALTER TABLE treatments ADD COLUMN IF NOT EXISTS diagnosis TEXT AFTER animal_id`);
  await conn.query(`ALTER TABLE treatments ADD COLUMN IF NOT EXISTS treatment_description TEXT AFTER medicine`);
  await conn.query(`ALTER TABLE treatments ADD COLUMN IF NOT EXISTS treatment_date DATE AFTER treatment_description`);
  await conn.query(`ALTER TABLE treatments ADD COLUMN IF NOT EXISTS follow_up_date DATE AFTER treatment_date`);
  await conn.query(`ALTER TABLE treatments ADD COLUMN IF NOT EXISTS veterinarian_name VARCHAR(200) AFTER dosage`);
}
