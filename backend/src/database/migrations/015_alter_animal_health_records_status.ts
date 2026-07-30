import { addColumnIfNotExists } from '../migrationHelpers';

export const name = '015_alter_animal_health_records_status';

export async function up(conn: any): Promise<void> {
  await addColumnIfNotExists(conn, 'animal_health_records', 'status', `VARCHAR(50) DEFAULT 'open' AFTER \`veterinarian\``);
  await addColumnIfNotExists(conn, 'animal_health_records', 'deleted_at', 'TIMESTAMP NULL AFTER `status`');
}
