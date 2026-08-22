import { Connection } from 'mysql2/promise';

export const name = '023_extend_breeding_pregnancy_enums_workflow';

/**
 * Migration 023 — extend workflow ENUMs (additive only).
 * Reads each column's live enum values and appends any missing workflow states,
 * preserving whatever already exists in that environment. Every statement is
 * individually guarded so boot can never be blocked (fail-safe deployment).
 */
const appendEnumValues = async (
  conn: Connection,
  table: string,
  column: string,
  requiredValues: string[]
): Promise<void> => {
  try {
    const [cols]: any = await conn.query(
      `SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
      [table, column]
    );
    if (!cols.length) { console.error(`[m023] ${table}.${column} not found — skipped`); return; }

    let colType: string = cols[0].COLUMN_TYPE || '';
    // If the column is not an enum (unexpected environment), leave it untouched.
    if (!/^enum\(/i.test(colType)) { console.log(`[m023] ${table}.${column} is not ENUM — skipped`); return; }

    const existing = colType.slice(5, -1)
      .split(',')
      .map((v: string) => v.trim().replace(/^'|'$/g, '').replace(/''/g, "'"));

    const merged = [...existing];
    for (const v of requiredValues) if (!existing.includes(v)) merged.push(v);

    if (merged.length === existing.length) { console.log(`[m023] ${table}.${column} already complete`); return; }

    const newType = `ENUM(${merged.map(v => `'${v.replace(/'/g, "''")}'`).join(',')})`;
    const [nullAble]: any = await conn.query(
      `SELECT IS_NULLABLE, COLUMN_DEFAULT FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
      [table, column]
    );
    const nullable = nullAble?.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL';
    const def = nullAble?.COLUMN_DEFAULT != null
      ? ` DEFAULT '${String(nullAble.COLUMN_DEFAULT).replace(/'/g, "''")}'`
      : '';

    await conn.query(`ALTER TABLE \`${table}\` MODIFY COLUMN \`${column}\` ${newType} ${nullable}${def}`);
    console.log(`[m023] extended ${table}.${column} -> ${merged.join('|')}`);
  } catch (e: any) {
    console.error(`[m023] skipped ${table}.${column}: ${e?.message}`);
  }
};

export async function up(conn: Connection): Promise<void> {
  await appendEnumValues(conn, 'pregnancies', 'status',
    ['Pregnant', 'Delivered', 'Failed', 'Aborted', 'Under Observation', 'confirmed', 'monitoring', 'delivered', 'failed', 'Returned Heat', 'Rebred']);
  await appendEnumValues(conn, 'breeding_records', 'result',
    ['successful', 'failed', 'pending', 'inseminated', 'pregnant', 'returned_heat', 'rebred', 'delivered']);
}

export async function down(conn: Connection): Promise<void> {
  void conn;
}
