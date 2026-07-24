import mysql from 'mysql2/promise';
import { addColumnIfNotExists } from '../migrationHelpers';

export const name = '006_alter_deleted_at_existing_updates';

export async function up(conn: mysql.Connection): Promise<void> {
  // Tables that already have updated_at — add deleted_at
  await addColumnIfNotExists(conn, 'animal_categories', 'deleted_at', `TIMESTAMP NULL AFTER \`updated_at\``);
  await addColumnIfNotExists(conn, 'diseases', 'deleted_at', `TIMESTAMP NULL AFTER \`updated_at\``);
  await addColumnIfNotExists(conn, 'pregnancies', 'deleted_at', `TIMESTAMP NULL AFTER \`updated_at\``);
}
