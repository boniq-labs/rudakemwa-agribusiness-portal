import mysql from 'mysql2/promise';

export async function addColumnIfNotExists(
  conn: mysql.Connection,
  table: string,
  column: string,
  definition: string
): Promise<boolean> {
  const [rows] = await conn.query(
    `SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column]
  );
  const row = (rows as any[])[0];
  if (row.cnt > 0) return false;
  await conn.query(`ALTER TABLE \`${table}\` ADD COLUMN ${definition}`);
  return true;
}

export async function modifyColumn(
  conn: mysql.Connection,
  table: string,
  column: string,
  definition: string
): Promise<void> {
  await conn.query(`ALTER TABLE \`${table}\` MODIFY COLUMN \`${column}\` ${definition}`);
}

export async function dropForeignKeyIfExists(
  conn: mysql.Connection,
  table: string,
  constraint: string
): Promise<boolean> {
  const [rows] = await conn.query(
    `SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND CONSTRAINT_NAME = ? AND CONSTRAINT_TYPE = 'FOREIGN KEY'`,
    [table, constraint]
  );
  const row = (rows as any[])[0];
  if (row.cnt === 0) return false;
  await conn.query(`ALTER TABLE \`${table}\` DROP FOREIGN KEY \`${constraint}\``);
  return true;
}

export async function addColumnAfter(
  conn: mysql.Connection,
  table: string,
  column: string,
  definition: string
): Promise<boolean> {
  return addColumnIfNotExists(conn, table, column, `${definition} AFTER \`${column}\``);
}

export async function hasColumn(
  conn: mysql.Connection,
  table: string,
  column: string
): Promise<boolean> {
  const [rows] = await conn.query(
    `SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column]
  );
  return (rows as any[])[0].cnt > 0;
}
