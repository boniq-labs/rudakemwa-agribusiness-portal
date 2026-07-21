import pool from '../config/database';
export async function logAudit(req, entry) {
    try {
        const ipAddress = req?.ip || req?.socket?.remoteAddress;
        const userAgent = req?.headers?.['user-agent'];
        await pool.query(`INSERT INTO activity_logs (user_id, action, module, description, ip_address, user_agent, previous_values, new_values)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [
            entry.userId,
            entry.action,
            entry.module,
            entry.description,
            ipAddress,
            userAgent,
            entry.previousValues ? JSON.stringify(entry.previousValues) : null,
            entry.newValues ? JSON.stringify(entry.newValues) : null,
        ]);
    }
    catch (err) {
        console.error('Audit log error:', err);
    }
}
export function createAuditEntry(req, action, module, description, newValues, previousValues) {
    return {
        userId: req.user?.id || null,
        action,
        module,
        description: `${req.user?.username || 'system'} - ${description}`,
        newValues,
        previousValues,
    };
}
//# sourceMappingURL=auditService.js.map