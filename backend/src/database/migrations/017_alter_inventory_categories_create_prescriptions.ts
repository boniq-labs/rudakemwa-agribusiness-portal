import mysql from 'mysql2/promise';
import { addColumnIfNotExists } from '../migrationHelpers';

export const name = '017_alter_inventory_categories_create_prescriptions';

export async function up(conn: mysql.Connection): Promise<void> {
  // inventory_categories is queried/soft-deleted via deleted_at but the column was missing
  await addColumnIfNotExists(conn, 'inventory_categories', 'deleted_at', 'TIMESTAMP NULL AFTER `updated_at`');

  // prescriptions table is used by the veterinary prescription CRUD + vet dashboard
  await conn.query(`
    CREATE TABLE IF NOT EXISTS prescriptions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      animal_id INT NOT NULL,
      medicine VARCHAR(200) NOT NULL,
      dosage VARCHAR(100),
      duration VARCHAR(100),
      frequency VARCHAR(100),
      start_date DATE,
      end_date DATE,
      veterinarian INT,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      deleted_at TIMESTAMP NULL,
      FOREIGN KEY (animal_id) REFERENCES animals(id) ON DELETE CASCADE,
      FOREIGN KEY (veterinarian) REFERENCES users(id) ON DELETE SET NULL
    )
  `);
}
