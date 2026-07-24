import mysql from 'mysql2/promise';
import { addColumnIfNotExists } from '../migrationHelpers';

export const name = '007_alter_animal_tables_timestamps';

export async function up(conn: mysql.Connection): Promise<void> {
  // Tables missing updated_at: add updated_at first, then deleted_at
  const tables: Array<{ table: string; hasUpdatedAt?: boolean }> = [
    { table: 'breeding_records' },
    { table: 'birth_records' },
    { table: 'feeding_records' },
    { table: 'weight_records' },
    { table: 'vaccinations' },
    { table: 'treatments' },
    { table: 'animal_transfers' },
    { table: 'animal_purchases' },
    { table: 'animal_sales' },
    { table: 'animal_deaths' },
  ];

  for (const { table } of tables) {
    await addColumnIfNotExists(conn, table, 'updated_at', `TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER \`created_at\``);
    await addColumnIfNotExists(conn, table, 'deleted_at', `TIMESTAMP NULL AFTER \`updated_at\``);
  }
}
