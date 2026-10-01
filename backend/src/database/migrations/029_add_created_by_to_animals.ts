import mysql from 'mysql2/promise';

export const name = '029_add_created_by_to_animals';

export async function up(conn: mysql.Connection): Promise<void> {
  await conn.query(`
    ALTER TABLE animals
    ADD COLUMN created_by INT NULL,
    ADD CONSTRAINT fk_animals_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
  `);
}