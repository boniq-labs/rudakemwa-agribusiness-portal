import { Connection } from 'mysql2/promise';

export const name = '022_add_insemination_fields_to_breeding_records';

/**
 * Migration 022 — Breeding & Reproduction workflow support.
 * Adds nullable AI fields to breeding_records. Fully additive & idempotent.
 * Each statement is individually guarded so an unexpected environment state
 * can never block application boot (fail-safe deployment policy).
 */
export async function up(conn: Connection): Promise<void> {
  const addColumnIfNotExists = async (table: string, column: string, definition: string) => {
    try {
      const [cols]: any = await conn.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
        [table, column]
      );
      if (cols.length === 0) {
        await conn.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
        console.log(`[m022] added ${table}.${column}`);
      }
    } catch (e: any) {
      console.error(`[m022] skipped ${table}.${column}: ${e?.message}`);
    }
  };
  await addColumnIfNotExists('breeding_records', 'insemination_date', 'DATE NULL AFTER `breeding_date`');
  await addColumnIfNotExists('breeding_records', 'technician', `VARCHAR(200) NULL AFTER \`insemination_date\``);
}

export async function down(conn: Connection): Promise<void> {
  void conn;
}
