import mysql from 'mysql2/promise';

export const name = '002_default_settings';

export async function up(conn: mysql.Connection): Promise<void> {
  const defaultSettings = [
    { key: 'system_name', value: 'EFMS' },
    { key: 'farm_name', value: 'Rudakemwa Farm' },
    { key: 'farm_address', value: '' },
    { key: 'phone_number', value: '' },
    { key: 'email', value: '' },
    { key: 'system_info', value: '' },
  ];
  for (const s of defaultSettings) {
    await conn.query(
      `INSERT IGNORE INTO app_settings (setting_key, setting_value) VALUES (?, ?)`,
      [s.key, s.value]
    );
  }
}
