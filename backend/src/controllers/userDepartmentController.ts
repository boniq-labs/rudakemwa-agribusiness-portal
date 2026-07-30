import { Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middlewares/auth';
import { success, error } from '../utils/response';

export const getUserDepartments = async (req: AuthRequest, res: Response) => {
  try {
    const [rows]: any = await pool.query(
      `SELECT d.id, d.name FROM departments d
       JOIN user_departments ud ON d.id = ud.department_id
       WHERE ud.user_id = ? AND d.deleted_at IS NULL
       ORDER BY d.name`,
      [req.params.id]
    );
    return success(res, rows);
  } catch (err: any) {
    return error(res, err.message);
  }
};

export const updateUserDepartments = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.params.id;
    const { department_ids } = req.body;

    if (!Array.isArray(department_ids)) {
      return error(res, 'department_ids must be an array', 400);
    }

    const [userRows]: any = await pool.query(
      'SELECT id FROM users WHERE id = ? AND deleted_at IS NULL',
      [userId]
    );
    if (userRows.length === 0) {
      return error(res, 'User not found', 404);
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      await conn.query('DELETE FROM user_departments WHERE user_id = ?', [userId]);

      if (department_ids.length > 0) {
        const placeholders = department_ids.map(() => '(?, ?)').join(', ');
        const values: number[] = [];
        for (const deptId of department_ids) {
          values.push(Number(userId), Number(deptId));
        }
        await conn.query(
          `INSERT INTO user_departments (user_id, department_id) VALUES ${placeholders}`,
          values
        );
      }

      await conn.commit();
      return success(res, null, 'Departments assigned successfully');
    } catch (err: any) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (err: any) {
    return error(res, err.message);
  }
};

export const getMyDepartments = async (req: AuthRequest, res: Response) => {
  try {
    const [rows]: any = await pool.query(
      `SELECT d.id, d.name FROM departments d
       JOIN user_departments ud ON d.id = ud.department_id
       WHERE ud.user_id = ? AND d.deleted_at IS NULL
       ORDER BY d.name`,
      [req.user!.id]
    );
    return success(res, rows);
  } catch (err: any) {
    return error(res, err.message);
  }
};

export const getEmployeesWithRoles = async (req: AuthRequest, res: Response) => {
  try {
    const [rows]: any = await pool.query(
      `SELECT u.id, u.username, u.first_name, u.last_name, u.email,
              r.slug as role, r.name as role_name,
              u.department_id
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.deleted_at IS NULL AND u.is_active = 1
       ORDER BY u.first_name, u.last_name`
    );
    return success(res, rows);
  } catch (err: any) {
    return error(res, err.message);
  }
};
