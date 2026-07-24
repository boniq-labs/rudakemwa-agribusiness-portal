import mysql from 'mysql2/promise';
import { dropForeignKeyIfExists, modifyColumn, addColumnIfNotExists } from '../migrationHelpers';

export const name = '003_alter_animal_transfers_feed_items';

export async function up(conn: mysql.Connection): Promise<void> {
  // Fix animal_transfers: drop INT foreign keys, make locations VARCHAR
  await dropForeignKeyIfExists(conn, 'animal_transfers', 'animal_transfers_ibfk_2');
  await dropForeignKeyIfExists(conn, 'animal_transfers', 'animal_transfers_ibfk_3');
  await modifyColumn(conn, 'animal_transfers', 'from_location', 'VARCHAR(255)');
  await modifyColumn(conn, 'animal_transfers', 'to_location', 'VARCHAR(255) NOT NULL');

  // feed_items missing columns
  await addColumnIfNotExists(conn, 'feed_items', 'code', `VARCHAR(50) AFTER \`name\``);
  await addColumnIfNotExists(conn, 'feed_items', 'min_stock_level', `DECIMAL(10,2) DEFAULT 0 AFTER \`unit\``);
  await addColumnIfNotExists(conn, 'feed_items', 'max_stock_level', `DECIMAL(10,2) DEFAULT 0 AFTER \`min_stock_level\``);
  await addColumnIfNotExists(conn, 'feed_items', 'purchase_price', `DECIMAL(12,2) DEFAULT 0 AFTER \`expiry_date\``);
  await addColumnIfNotExists(conn, 'feed_items', 'supplier_name', `VARCHAR(200) AFTER \`purchase_price\``);
  await addColumnIfNotExists(conn, 'feed_items', 'notes', `TEXT AFTER \`supplier_name\``);
  await addColumnIfNotExists(conn, 'feed_items', 'deleted_at', `TIMESTAMP NULL AFTER \`updated_at\``);
}
