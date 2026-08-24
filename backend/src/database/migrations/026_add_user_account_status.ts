import { Connection } from 'mysql2/promise';

export const name = '026_add_user_account_status';

/**
 * Migration 026 — User Management suspension support.
 * Adds users.account_status: 'active' | 'suspended' | 'on_leave'.
 * Suspension blocks login and API access WITHOUT touching roles,
 * departments, permissions or any other user data.
 */
export async function up(conn: Connection): Promise<void> {
  try {
    const [cols]: any = await conn.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'account_status'`
    );
    if (cols.length === 0) {
      await conn.query(
        `ALTER TABLE users ADD COLUMN account_status ENUM('active','suspended','on_leave') NOT NULL DEFAULT 'active' AFTER is_active`
      );
      console.log('[m026] added users.account_status');
    }
  } catch (e: any) {
    console.error(`[m026] skipped: ${e?.message}`);
  }
}

export async function down(conn: Connection): Promise<void> {
  void conn;
}
