import mysql from 'mysql2/promise';

export const name = '014_create_tobe_in_hit';

export async function up(conn: mysql.Connection): Promise<void> {
  await conn.query(`
    CREATE TABLE IF NOT EXISTS tobe_in_hit (
      id INT AUTO_INCREMENT PRIMARY KEY,
      animal_category_id INT,
      animal_id INT,
      tobe_date DATE NOT NULL,
      created_by INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (animal_category_id) REFERENCES animal_categories(id) ON DELETE SET NULL,
      FOREIGN KEY (animal_id) REFERENCES animals(id) ON DELETE SET NULL,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    )
  `);
}
