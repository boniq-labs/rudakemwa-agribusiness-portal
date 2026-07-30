import mysql from 'mysql2/promise';
import { MigrationRunner } from './MigrationRunner';
import * as m001 from './migrations/001_initial_schema';
import * as m002 from './migrations/002_default_settings';
import * as m003 from './migrations/003_alter_animal_transfers_feed_items';
import * as m004 from './migrations/004_alter_medicine_items_equipment';
import * as m005 from './migrations/005_alter_breeds_animals_users_land';
import * as m006 from './migrations/006_alter_deleted_at_existing_updates';
import * as m007 from './migrations/007_alter_animal_tables_timestamps';
import * as m008 from './migrations/008_alter_birth_vaccination_milk_customer';
import * as m009 from './migrations/009_alter_attendance';
import * as m010 from './migrations/010_alter_logistics_accounting';
import * as m011 from './migrations/011_alter_employee_code_length';
import * as m012 from './migrations/012_alter_sales_orders_deleted_at';
import * as m013 from './migrations/013_alter_expense_records_add_columns';
import * as m014 from './migrations/014_create_tobe_in_hit';
import * as m015 from './migrations/015_alter_animal_health_records_status';

const migrations = [
  { name: m001.name, up: m001.up },
  { name: m002.name, up: m002.up },
  { name: m003.name, up: m003.up },
  { name: m004.name, up: m004.up },
  { name: m005.name, up: m005.up },
  { name: m006.name, up: m006.up },
  { name: m007.name, up: m007.up },
  { name: m008.name, up: m008.up },
  { name: m009.name, up: m009.up },
  { name: m010.name, up: m010.up },
  { name: m011.name, up: m011.up },
  { name: m012.name, up: m012.up },
  { name: m013.name, up: m013.up },
  { name: m014.name, up: m014.up },
  { name: m015.name, up: m015.up },
];

export async function runMigrations(conn: mysql.Connection): Promise<void> {
  const runner = new MigrationRunner(conn);
  await runner.runMigrations(migrations);
}

export async function migrationStatus(conn: mysql.Connection): Promise<void> {
  const runner = new MigrationRunner(conn);
  await runner.status(migrations);
}

export { migrations };
