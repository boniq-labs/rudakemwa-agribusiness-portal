import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import pool from '../config/database';
import { canAccessDepartment, departmentRoleMap, departmentNameToRole } from '../utils/departmentAccess';
// NB: departmentRoleMap provides mapped cross-department permissions — e.g. crops role gets sales.*, milk gets veterinary.*

export interface AuthRequest extends Request {
  user?: { id: number; username: string; role: string; roleId: number; departmentId: number | null; permissions: string[]; departmentRoles: string[] };
}

const isSuperAdmin = (role: string) => role === 'owner' || role === 'farm_owner' || role === 'admin';

const getDepartmentRolesForUser = async (userId: number): Promise<string[]> => {
  try {
    const [rows]: any = await pool.query(
      `SELECT d.name FROM departments d
       JOIN user_departments ud ON d.id = ud.department_id
       WHERE ud.user_id = ? AND d.deleted_at IS NULL`,
      [userId]
    );
    const slugs: string[] = [];
    for (const row of rows) {
      const slug = departmentNameToRole[row.name.toLowerCase()];
      if (slug) slugs.push(slug);
    }
    return slugs;
  } catch {
    return [];
  }
};

const getPermissionsForRoles = async (roles: string[]): Promise<string[]> => {
  if (roles.length === 0) return [];
  try {
    const placeholders = roles.map(() => '?').join(',');
    const [rows]: any = await pool.query(
      `SELECT DISTINCT p.slug FROM permissions p
       JOIN role_permissions rp ON p.id = rp.permission_id
       JOIN roles r ON rp.role_id = r.id
       WHERE r.slug IN (${placeholders})`,
      roles
    );
    return rows.map((r: any) => r.slug);
  } catch {
    return [];
  }
};

// Effective permission set = primary role permissions + mapped cross-department
// role permissions + permissions from departments the user is assigned to
// (user_departments). This union is what the backend enforces via authorize().
export const getEffectivePermissions = async (userId: number, roleSlug: string): Promise<{ permissions: string[]; departmentRoles: string[] }> => {
  let permissions = await getPermissionsForRoles([roleSlug]);

  // Include permissions from mapped cross-department role
  const extraDept = departmentRoleMap[roleSlug];
  if (extraDept) {
    const extra = await getPermissionsForRoles([extraDept]);
    permissions = [...new Set([...permissions, ...extra])];
  }

  // Load department-based roles and their permissions
  const departmentRoles = await getDepartmentRolesForUser(userId);
  if (departmentRoles.length > 0) {
    const deptPerms = await getPermissionsForRoles(departmentRoles);
    permissions = [...new Set([...permissions, ...deptPerms])];
  }

  return { permissions, departmentRoles };
};

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
    const [rows]: any = await pool.query(
      `SELECT u.id, u.username, u.account_status, r.slug as role, u.role_id, u.department_id
       FROM users u JOIN roles r ON u.role_id = r.id
       WHERE u.id = ? AND u.is_active = 1 AND u.deleted_at IS NULL`,
      [payload.id]
    );
    if (rows.length === 0) return res.status(401).json({ error: 'User not found or inactive' });
    if (rows[0].account_status === 'suspended') return res.status(403).json({ error: 'Account is suspended. Contact an administrator.' });
    if (rows[0].account_status === 'on_leave') return res.status(403).json({ error: 'Account is on leave. Contact an administrator to reactivate.' });

    const user = rows[0];
    const { permissions, departmentRoles } = await getEffectivePermissions(user.id, user.role);

    req.user = {
      id: user.id,
      username: user.username,
      role: user.role,
      roleId: user.role_id,
      departmentId: user.department_id,
      permissions,
      departmentRoles,
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
    const hasMappedAccess = roles.some(r => canAccessDepartment(req.user!.role, r));
    if (hasMappedAccess) return next();
    const hasDeptAccess = roles.some(r => req.user!.departmentRoles.includes(r));
    if (hasDeptAccess) return next();
    return res.status(403).json({ error: 'Insufficient role' });
  };
};
