import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import pool from '../config/database';
import { success, error } from '../utils/response';
import { logAudit, createAuditEntry } from '../services/auditService';
const BACKUP_DIR = process.env.BACKUP_DIR || './backups';
if (!fs.existsSync(BACKUP_DIR))
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
export const getSystemHealth = async (req, res) => {
    try {
        const start = Date.now();
        await pool.query('SELECT 1');
        const dbLatency = Date.now() - start;
        const [[{ dbSize }]] = await pool.query("SELECT ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) as dbSize FROM information_schema.tables WHERE table_schema='efms'");
        const [[{ userCount }]] = await pool.query('SELECT COUNT(*) as userCount FROM users WHERE deleted_at IS NULL');
        const [[{ activeSessions }]] = await pool.query("SELECT COUNT(*) as activeSessions FROM sessions WHERE expires_at > NOW()");
        success(res, {
            status: 'healthy',
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
            database: { connected: true, latency: `${dbLatency}ms`, size: `${dbSize}MB` },
            system: { users: userCount, activeSessions, nodeVersion: process.version, platform: process.platform },
            memory: {
                total: `${(process.memoryUsage().heapTotal / 1024 / 1024).toFixed(2)}MB`,
                used: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB`,
                rss: `${(process.memoryUsage().rss / 1024 / 1024).toFixed(2)}MB`,
            },
        });
    }
    catch (err) {
        success(res, { status: 'degraded', database: { connected: false, error: err.message }, uptime: process.uptime() }, 'System degraded', 200);
    }
};
export const createBackup = async (req, res) => {
    try {
        const db = process.env.DB_NAME || 'efms';
        const user = process.env.DB_USER || 'root';
        const password = process.env.DB_PASSWORD || '';
        const host = process.env.DB_HOST || 'localhost';
        const filename = `efms_backup_${Date.now()}.sql`;
        const filepath = path.join(BACKUP_DIR, filename);
        const cmd = `mysqldump -h ${host} -u ${user} ${password ? `-p${password}` : ''} ${db} > "${filepath}"`;
        exec(cmd, async (err) => {
            if (err)
                return error(res, `Backup failed: ${err.message}`, 500);
            const stats = fs.statSync(filepath);
            await logAudit(req, createAuditEntry(req, 'Backup', 'System', `Database backup created: ${filename} (${(stats.size / 1024 / 1024).toFixed(2)}MB)`));
            success(res, { filename, size: stats.size, path: filepath, createdAt: new Date() }, 'Backup created successfully');
        });
    }
    catch (err) {
        return error(res, err.message);
    }
};
export const listBackups = async (req, res) => {
    try {
        const files = fs.readdirSync(BACKUP_DIR)
            .filter(f => f.endsWith('.sql'))
            .map(f => {
            const stats = fs.statSync(path.join(BACKUP_DIR, f));
            return { filename: f, size: stats.size, createdAt: stats.birthtime, modifiedAt: stats.mtime };
        })
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        success(res, { backups: files, count: files.length, backupDir: BACKUP_DIR });
    }
    catch (err) {
        return error(res, err.message);
    }
};
export const restoreBackup = async (req, res) => {
    try {
        const { filename } = req.body;
        const filepath = path.join(BACKUP_DIR, filename);
        if (!fs.existsSync(filepath))
            return error(res, 'Backup file not found', 404);
        const db = process.env.DB_NAME || 'efms';
        const user = process.env.DB_USER || 'root';
        const password = process.env.DB_PASSWORD || '';
        const host = process.env.DB_HOST || 'localhost';
        const cmd = `mysql -h ${host} -u ${user} ${password ? `-p${password}` : ''} ${db} < "${filepath}"`;
        exec(cmd, async (err) => {
            if (err)
                return error(res, `Restore failed: ${err.message}`, 500);
            await logAudit(req, createAuditEntry(req, 'Restore', 'System', `Database restored from: ${filename}`));
            success(res, null, 'Database restored successfully');
        });
    }
    catch (err) {
        return error(res, err.message);
    }
};
//# sourceMappingURL=systemController.js.map