import pool from '../config/database';
import { success, error } from '../utils/response';
export const getNotifications = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50', [req.user.id]);
        const [[{ unread }]] = await pool.query('SELECT COUNT(*) as unread FROM notifications WHERE user_id = ? AND is_read = 0', [req.user.id]);
        return success(res, { notifications: rows, unreadCount: unread });
    }
    catch (err) {
        return error(res, err.message);
    }
};
export const markAsRead = async (req, res) => {
    try {
        const [result] = await pool.query('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
        if (result.affectedRows === 0)
            return error(res, 'Notification not found', 404);
        return success(res, null, 'Marked as read');
    }
    catch (err) {
        return error(res, err.message);
    }
};
export const markAllAsRead = async (req, res) => {
    try {
        const [result] = await pool.query('UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0', [req.user.id]);
        return success(res, { marked: result.affectedRows }, 'All notifications marked as read');
    }
    catch (err) {
        return error(res, err.message);
    }
};
export async function createNotification(userId, type, title, message, link) {
    await pool.query('INSERT INTO notifications (user_id, type, title, message, link) VALUES (?,?,?,?,?)', [userId, type, title, message, link || null]);
}
//# sourceMappingURL=notificationController.js.map