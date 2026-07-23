import { Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middlewares/auth';
import { success, error } from '../utils/response';

export const getSettings = async (req: AuthRequest, res: Response) => {
  try {
    const [rows]: any = await pool.query('SELECT setting_key, setting_value FROM app_settings');
    const settings: Record<string, string> = {};
    for (const r of rows) settings[r.setting_key] = r.setting_value;
    return success(res, settings);
  } catch (err: any) { return error(res, err.message); }
};

export const updateSettings = async (req: AuthRequest, res: Response) => {
  try {
    const allowedKeys = ['system_name', 'farm_name', 'farm_logo', 'favicon', 'farm_address', 'phone_number', 'email', 'system_info'];
    for (const key of allowedKeys) {
      if (req.body[key] !== undefined) {
        await pool.query(
          'INSERT INTO app_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)',
          [key, req.body[key]]
        );
      }
    }
    return success(res, null, 'Settings updated successfully');
  } catch (err: any) { return error(res, err.message); }
};
