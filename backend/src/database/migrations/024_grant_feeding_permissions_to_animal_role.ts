import { Connection } from 'mysql2/promise';

export const name = '024_grant_feeding_permissions_to_animal_role';

/**
 * Migration 024 — Feeding Management authorization fix.
 * Grants the four feeding.* permissions to the existing 'animal' role
 * (Animal Production Manager), which already manages this module
 * (view/create/update/delete) under the standard role_permissions model.
 *
 * Guarded & idempotent: every insert is skipped if the grant already exists.
 * No other roles, modules, or permissions are touched.
 */
const grantIfMissing = async (
  conn: Connection,
  roleSlug: string,
  permSlug: string
): Promise<void> => {
  try {
    await conn.query(
      `INSERT INTO role_permissions (role_id, permission_id)
       SELECT r.id, p.id
       FROM roles r CROSS JOIN permissions p
       WHERE r.slug = ? AND p.slug = ?
         AND NOT EXISTS (
           SELECT 1 FROM role_permissions rp
           WHERE rp.role_id = r.id AND rp.permission_id = p.id
         )`,
      [roleSlug, permSlug]
    );
    console.log(`[m024] ensured ${roleSlug}:${permSlug}`);
  } catch (e: any) {
    console.error(`[m024] skipped ${roleSlug}:${permSlug}: ${e?.message}`);
  }
};

export async function up(conn: Connection): Promise<void> {
  for (const perm of ['feeding.view', 'feeding.create', 'feeding.update', 'feeding.delete']) {
    await grantIfMissing(conn, 'animal', perm);
  }
}

export async function down(conn: Connection): Promise<void> {
  // Intentionally non-destructive: removing grants could lock managers out.
  void conn;
}
