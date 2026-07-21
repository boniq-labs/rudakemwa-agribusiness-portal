import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import pool from '../config/database';

export interface AuthRequest extends Request {
  user?: { id: number; username: string; role: string; roleId: number; departmentId: number | null; permissions: string[] };
}

const isSuperAdmin = (role: string) => role === 'owner' || role === 'farm_owner' || role === 'admin';

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
    const [rows]: any = await pool.query(
      `SELECT u.id, u.username, r.slug as role, u.role_id, u.department_id,
       GROUP_CONCAT(DISTINCT p.slug) as permissions
       FROM users u JOIN roles r ON u.role_id = r.id
       LEFT JOIN role_permissions rp ON r.id = rp.role_id
       LEFT JOIN permissions p ON rp.permission_id = p.id
       WHERE u.id = ? AND u.is_active = 1 AND u.deleted_at IS NULL
       GROUP BY u.id`,
      [payload.id]
    );
    if (rows.length === 0) return res.status(401).json({ error: 'User not found or inactive' });

    const user = rows[0];
    req.user = {
      id: user.id,
      username: user.username,
      role: user.role,
      roleId: user.role_id,
      departmentId: user.department_id,
      permissions: user.permissions ? user.permissions.split(',') : [],
    };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

export const authorize = (requiredPermissions: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    if (isSuperAdmin(req.user.role)) return next();

    const hasAll = requiredPermissions.every(p => req.user!.permissions.includes(p));
    if (!hasAll) return res.status(403).json({ error: 'Insufficient permissions' });
    next();
  };
};

export const hasRole = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    if (isSuperAdmin(req.user.role) || roles.includes(req.user.role)) return next();
    return res.status(403).json({ error: 'Insufficient role' });
  };
};
