import { addColumnIfNotExists } from '../migrationHelpers';

export const name = '021_alter_suppliers_supplier_categories';

export async function up(conn: any): Promise<void> {
  await addColumnIfNotExists(conn, 'suppliers', 'contact_person', 'VARCHAR(200) DEFAULT NULL AFTER `supplier_name`');
  await addColumnIfNotExists(conn, 'supplier_categories', 'deleted_at', 'TIMESTAMP NULL');
}