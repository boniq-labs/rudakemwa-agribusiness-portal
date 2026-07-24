import mysql from 'mysql2/promise';

interface Migration {
  name: string;
  up: (conn: mysql.Connection) => Promise<void>;
}

export class MigrationRunner {
  private conn: mysql.Connection;

  constructor(conn: mysql.Connection) {
    this.conn = conn;
  }

  async ensureTrackingTable(): Promise<void> {
    await this.conn.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(200) NOT NULL UNIQUE,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  async getAppliedMigrations(): Promise<Set<string>> {
    const [rows] = await this.conn.query(
      `SELECT name FROM schema_migrations ORDER BY id`
    );
    return new Set((rows as any[]).map((r: any) => r.name));
  }

  async getPendingMigrations(
    migrations: Migration[],
    applied: Set<string>
  ): Promise<Migration[]> {
    return migrations.filter((m) => !applied.has(m.name));
  }

  async runMigrations(migrations: Migration[]): Promise<void> {
    await this.ensureTrackingTable();
    const applied = await this.getAppliedMigrations();
    const pending = await this.getPendingMigrations(migrations, applied);

    if (pending.length === 0) {
      console.log('No pending migrations');
      return;
    }

    console.log(`Found ${pending.length} pending migration(s)`);

    for (const migration of pending) {
      console.log(`Running migration: ${migration.name}...`);
      try {
        await migration.up(this.conn);
        await this.conn.query(
          `INSERT INTO schema_migrations (name) VALUES (?)`,
          [migration.name]
        );
        console.log(`Migration ${migration.name} applied successfully`);
      } catch (err: any) {
        console.error(`Migration ${migration.name} FAILED: ${err.message}`);
        throw err;
      }
    }
  }

  async rollbackMigrations(migrations: Migration[]): Promise<void> {
    throw new Error('Rollback not implemented');
  }

  async status(migrations: Migration[]): Promise<void> {
    await this.ensureTrackingTable();
    const applied = await this.getAppliedMigrations();
    const pending = await this.getPendingMigrations(migrations, applied);

    for (const m of migrations) {
      const status = applied.has(m.name) ? '✓' : '✗';
      console.log(`  ${status} ${m.name}`);
    }
    console.log(`\n${applied.size} applied, ${pending.length} pending`);
  }
}
