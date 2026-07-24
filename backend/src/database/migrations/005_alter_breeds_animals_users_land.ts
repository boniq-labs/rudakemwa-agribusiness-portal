import mysql from 'mysql2/promise';
import { addColumnIfNotExists, modifyColumn } from '../migrationHelpers';

export const name = '005_alter_breeds_animals_users_land';

export async function up(conn: mysql.Connection): Promise<void> {
  // breeds missing columns (already have updated_at in CREATE TABLE, but ensure)
  await addColumnIfNotExists(conn, 'breeds', 'updated_at', `TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER \`created_at\``);
  await addColumnIfNotExists(conn, 'breeds', 'deleted_at', `TIMESTAMP NULL AFTER \`updated_at\``);

  // animals missing columns (feed_type, animal_status already in CREATE TABLE, but safe)
  await addColumnIfNotExists(conn, 'animals', 'feed_type', `VARCHAR(50) AFTER \`milk_status\``);
  await addColumnIfNotExists(conn, 'animals', 'animal_status', `VARCHAR(50) AFTER \`feed_type\``);
  await modifyColumn(conn, 'animals', 'photo', 'LONGTEXT');
  await modifyColumn(conn, 'users', 'photo', 'LONGTEXT');

  // land_areas area_size nullable
  await modifyColumn(conn, 'land_areas', 'area_size', 'DECIMAL(10,2) NULL');

  // pregnancies missing sire_name
  await addColumnIfNotExists(conn, 'pregnancies', 'sire_name', `VARCHAR(200) AFTER \`expected_delivery_date\``);
}
