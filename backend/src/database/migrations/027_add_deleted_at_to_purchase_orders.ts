import { Connection } from 'mysql2/promise';

export const name = '027_add_deleted_at_to_purchase_orders';

/**
 * Migration 027 - Procurement Orders soft delete support.
 * Adds purchase_orders.deleted_at to enable soft-delete pattern
 * consistent with other tables in the system.
 */
export async function up(conn: Connection): Promise<void> {
  try {
    const [cols]: any = await conn.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'purchase_orders' AND COLUMN_NAME = 'deleted_at'`
    );
    if (cols.length === 0) {
      await conn.query(
        `ALTER TABLE \`purchase_orders\` ADD COLUMN \`deleted_at\` TIMESTAMP NULL AFTER \`updated_at\``
      );
      console.log('[m027] added purchase_orders.deleted_at');
    }
  } catch (e: any) {
    console.error(`[m027] skipped: ${e?.message}`);
  }
}

export async function down(conn: Connection): Promise<void> {
  // Non-destructive: keep the column in case it's needed for rollback
  void conn;
}