import { Response } from 'express';
import jwt, { type SignOptions } from 'jsonwebtoken';
import pool from '../config/database';
import { hashPassword, comparePassword } from '../utils/helpers';
import { AuthRequest, getEffectivePermissions } from '../middlewares/auth';
import { success, error, AppError } from '../utils/response';
import { logAudit, createAuditEntry } from '../services/auditService';

const generateTokens = (user: any) => {
  const tokenOpts: SignOptions = { expiresIn: (process.env.JWT_EXPIRES_IN || '1h') as any };
  const refreshOpts: SignOptions = { expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as any };
  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET || 'secret',
    tokenOpts
  );
  const refreshToken = jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET || 'refresh_secret',
    refreshOpts
  );
  return { token, refreshToken };
};

export const login = async (req: AuthRequest, res: Response) => {
  try {
    console.log('Login attempt for:', req.body?.username);
    const { username, password } = req.body;

    const [users]: any = await pool.query(
      `SELECT u.*, r.slug as role, r.name as role_name, d.name as department_name
       FROM users u JOIN roles r ON u.role_id = r.id
       LEFT JOIN departments d ON u.department_id = d.id
       WHERE (u.username = ? OR u.email = ?) AND u.deleted_at IS NULL`,
      [username, username]
    );
    if (users.length === 0) return error(res, 'Invalid credentials', 401);

    const user = users[0];
    if (!user.is_active) return error(res, 'Account is deactivated', 401);
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      const remaining = Math.ceil((new Date(user.locked_until).getTime() - Date.now()) / 60000);
      return error(res, `Account is locked. Try again in ${remaining} minutes.`, 401);
    }

    const valid = await comparePassword(password, user.password);
    if (!valid) {
      const attempts = user.failed_attempts + 1;
      if (attempts >= 5) {
        await pool.query('UPDATE users SET failed_attempts = ?, locked_until = DATE_ADD(NOW(), INTERVAL 15 MINUTE) WHERE id = ?', [attempts, user.id]);
        return error(res, 'Account locked for 15 minutes due to too many failed attempts', 401);
      }
      await pool.query('UPDATE users SET failed_attempts = ? WHERE id = ?', [attempts, user.id]);
      return error(res, `Invalid credentials. ${5 - attempts} attempts remaining.`, 401);
    }

    await pool.query('UPDATE users SET failed_attempts = 0, locked_until = NULL, last_login = NOW() WHERE id = ?', [user.id]);

    const { token, refreshToken } = generateTokens(user);
    await pool.query('UPDATE users SET refresh_token = ? WHERE id = ?', [refreshToken, user.id]);

    await logAudit(req, { userId: user.id, action: 'Login', module: 'Auth', description: `${user.first_name} ${user.last_name} logged in` });

    const { permissions } = await getEffectivePermissions(user.id, user.role);

    const [userDepts]: any = await pool.query(
      `SELECT d.id, d.name FROM departments d
       JOIN user_departments ud ON d.id = ud.department_id
       WHERE ud.user_id = ? AND d.deleted_at IS NULL`,
      [user.id]
    );

    return success(res, {
      token, refreshToken,
      user: {
        id: user.id, username: user.username, email: user.email,
        firstName: user.first_name, lastName: user.last_name, photo: user.photo,
        role: user.role, roleName: user.role_name,
        departmentId: user.department_id, departmentName: user.department_name,
        departments: userDepts,
        permissions,
      },
    }, 'Login successful');
  } catch (err: any) {
    console.error('Login error:', err.message, err.stack?.substring(0, 500));
    return error(res, err.message);
  }
};

export const refreshTokenHandler = async (req: AuthRequest, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return error(res, 'Refresh token required', 400);

    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'refresh_secret') as any;
    const [users]: any = await pool.query('SELECT * FROM users WHERE id = ? AND refresh_token = ?', [payload.id, refreshToken]);
    if (users.length === 0) return error(res, 'Invalid refresh token', 401);

    const user = users[0];
    const tokens = generateTokens(user);
    await pool.query('UPDATE users SET refresh_token = ? WHERE id = ?', [tokens.refreshToken, user.id]);

    return success(res, { token: tokens.token, refreshToken: tokens.refreshToken });
  } catch {
    return error(res, 'Invalid or expired refresh token', 401);
  }
};

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const [users]: any = await pool.query(
      `SELECT u.id, u.username, u.email, u.first_name, u.last_name, u.photo, u.phone,
       u.gender, u.address, u.date_of_birth, r.slug as role, r.name as role_name,
       d.name as department_name, d.id as department_id, u.created_at
       FROM users u JOIN roles r ON u.role_id = r.id
       LEFT JOIN departments d ON u.department_id = d.id
       WHERE u.id = ?`,
      [req.user!.id]
    );
    const u = users[0];
    if (!u) return error(res, 'User not found', 404);

    const [userDepts]: any = await pool.query(
      `SELECT d.id, d.name FROM departments d
       JOIN user_departments ud ON d.id = ud.department_id
       WHERE ud.user_id = ? AND d.deleted_at IS NULL`,
      [u.id]
    );

    const { permissions } = await getEffectivePermissions(u.id, u.role);

    const userData = {
      id: u.id, username: u.username, email: u.email,
      firstName: u.first_name, lastName: u.last_name, photo: u.photo,
      phone: u.phone, gender: u.gender, address: u.address,
      dateOfBirth: u.date_of_birth,
      role: u.role, roleName: u.role_name,
      departmentId: u.department_id, departmentName: u.department_name,
      departments: userDepts,
      createdAt: u.created_at,
      permissions,
    };
    return success(res, userData);
  } catch (err: any) {
    return error(res, err.message);
  }
};

export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const [users]: any = await pool.query('SELECT password FROM users WHERE id = ?', [req.user!.id]);
    const valid = await comparePassword(currentPassword, users[0].password);
    if (!valid) return error(res, 'Current password is incorrect', 400);

    const hashed = await hashPassword(newPassword);
    await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashed, req.user!.id]);

    await logAudit(req, createAuditEntry(req, 'Change Password', 'Auth', 'Password changed'));
    return success(res, null, 'Password changed successfully');
  } catch (err: any) {
    return error(res, err.message);
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { firstName, lastName, email, phone, photo } = req.body;
    const fields: string[] = [];
    const params: any[] = [];
    if (firstName !== undefined) { fields.push('first_name = ?'); params.push(firstName); }
    if (lastName !== undefined) { fields.push('last_name = ?'); params.push(lastName); }
    if (email !== undefined) { fields.push('email = ?'); params.push(email); }
    if (phone !== undefined) { fields.push('phone = ?'); params.push(phone); }
    if (photo !== undefined) { fields.push('photo = ?'); params.push(photo); }
    if (fields.length === 0) return error(res, 'No fields to update', 400);

    await pool.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, [...params, req.user!.id]);

    const [users]: any = await pool.query(
      `SELECT u.id, u.username, u.email, u.first_name, u.last_name, u.photo, u.phone,
       r.slug as role, r.name as role_name, d.name as department_name, d.id as department_id
       FROM users u JOIN roles r ON u.role_id = r.id
       LEFT JOIN departments d ON u.department_id = d.id WHERE u.id = ?`,
      [req.user!.id]
    );

    const [userDepts]: any = await pool.query(
      `SELECT d.id, d.name FROM departments d
       JOIN user_departments ud ON d.id = ud.department_id
       WHERE ud.user_id = ? AND d.deleted_at IS NULL`,
      [req.user!.id]
    );

    const { permissions } = await getEffectivePermissions(users[0].id, users[0].role);

    return success(res, {
      id: users[0].id, username: users[0].username, email: users[0].email,
      firstName: users[0].first_name, lastName: users[0].last_name, photo: users[0].photo,
      phone: users[0].phone, role: users[0].role, roleName: users[0].role_name,
      departmentId: users[0].department_id, departmentName: users[0].department_name,
      departments: userDepts,
      permissions,
    }, 'Profile updated successfully');
  } catch (err: any) {
    return error(res, err.message);
  }
};

export const logout = async (req: AuthRequest, res: Response) => {
  try {
    await pool.query('UPDATE users SET refresh_token = NULL WHERE id = ?', [req.user!.id]);
    await logAudit(req, createAuditEntry(req, 'Logout', 'Auth', 'User logged out'));
    return success(res, null, 'Logged out successfully');
  } catch (err: any) {
    return error(res, err.message);
  }
};
