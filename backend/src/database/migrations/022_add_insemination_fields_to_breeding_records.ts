import { Connection } from 'mysql2/promise';

export const name = '022_add_insemination_fields_to_breeding_records';

/**
 * Migration 022 — Breeding & Reproduction workflow support.
 * Adds AI (artificial insemination) fields to breeding_records:
 *  - insemination_date: actual AI date (defaults to breeding_date in code when omitted)
 *  - technician: free-text AI technician name (NOT a select)
 * Both are nullable so existing rows/data are preserved untouched.
 */
export async function up(conn: Connection): Promise<void> {
  const addColumnIfNotExists = async (
    table: string,
    column: string,
    definition: string
  ) => {
    const [cols]: any = await conn.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
      [table, column]
    );
    if (cols.length === 0) {
      await conn.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
    }
  };

  await addColumnIfNotExists('breeding_records', 'insemination_date', 'DATE NULL AFTER `breeding_date`');
  await addColumnIfNotExists('breeding_records', 'technician', `VARCHAR(200) NULL AFTER \`insemination_date\``);
}

export async function down(conn: Connection): Promise<void> {
  // Intentionally non-destructive: keep added columns (preserve data)
  void conn;
}
