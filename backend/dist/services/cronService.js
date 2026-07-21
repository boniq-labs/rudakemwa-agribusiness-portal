import cron from 'node-cron';
import pool from '../config/database';
import logger from '../utils/logger';
import { createNotification } from '../controllers/notificationController';
export function initCronJobs() {
    // Daily backup reminder (every day at 10 PM)
    cron.schedule('0 22 * * *', async () => {
        logger.info('Running daily backup reminder...');
        const [admins] = await pool.query("SELECT id FROM users WHERE role_id IN (SELECT id FROM roles WHERE slug IN ('owner','admin')) AND deleted_at IS NULL");
        for (const admin of admins) {
            await createNotification(admin.id, 'info', 'Backup Reminder', 'Please create a daily backup of the system.');
        }
    });
    // Vaccination reminders (every day at 6 AM)
    cron.schedule('0 6 * * *', async () => {
        logger.info('Checking vaccination due dates...');
        const [dueVaccinations] = await pool.query(`SELECT v.*, a.name as animal_name, a.tag, e.user_id FROM vaccinations v
       JOIN animals a ON v.animal_id = a.id
       JOIN employees e ON e.id = a.assigned_employee_id
       WHERE v.next_due_date = DATE_ADD(CURDATE(), INTERVAL 1 DAY)`);
        for (const v of dueVaccinations) {
            await createNotification(v.user_id, 'warning', 'Vaccination Due', `${v.animal_name} (${v.tag}) - ${v.vaccine_name} vaccination due tomorrow.`);
        }
    });
    // Expiring contracts (every day at 7 AM)
    cron.schedule('0 7 * * *', async () => {
        logger.info('Checking expiring contracts...');
        const [expiring] = await pool.query(`SELECT e.*, u.id as user_id, u.first_name, u.last_name FROM employees e
       JOIN users u ON e.user_id = u.id
       WHERE e.contract_end = DATE_ADD(CURDATE(), INTERVAL 30 DAY) AND e.status = 'active'`);
        const [hrUsers] = await pool.query("SELECT u.id FROM users u JOIN roles r ON u.role_id = r.id WHERE r.slug IN ('hr','owner','admin')");
        for (const emp of expiring) {
            for (const hr of hrUsers) {
                await createNotification(hr.id, 'warning', 'Contract Expiring', `${emp.first_name} ${emp.last_name}'s contract expires in 30 days.`);
            }
        }
    });
    // Low stock alerts (every day at 8 AM)
    cron.schedule('0 8 * * *', async () => {
        logger.info('Checking low stock items...');
        const [lowStock] = await pool.query('SELECT * FROM feed_stock WHERE quantity <= min_quantity');
        const [stockUsers] = await pool.query("SELECT u.id FROM users u JOIN roles r ON u.role_id = r.id WHERE r.slug IN ('stock','owner','admin')");
        for (const item of lowStock) {
            for (const u of stockUsers) {
                await createNotification(u.id, 'warning', 'Low Stock Alert', `${item.name} is low (${item.quantity} ${item.unit}). Minimum: ${item.min_quantity}`);
            }
        }
    });
    // Birthday reminders (every day at 5 AM)
    cron.schedule('0 5 * * *', async () => {
        const [birthdays] = await pool.query("SELECT * FROM employees WHERE MONTH(date_of_birth) = MONTH(CURDATE()) AND DAY(date_of_birth) = DAY(CURDATE())");
        if (birthdays.length > 0) {
            const [hrUsers] = await pool.query("SELECT u.id FROM users u JOIN roles r ON u.role_id = r.id WHERE r.slug IN ('hr','owner','admin')");
            for (const emp of birthdays) {
                for (const hr of hrUsers) {
                    await createNotification(hr.id, 'info', 'Birthday Reminder', `Today is ${emp.first_name} ${emp.last_name}'s birthday!`);
                }
            }
        }
    });
    logger.info('Cron jobs initialized');
}
//# sourceMappingURL=cronService.js.map