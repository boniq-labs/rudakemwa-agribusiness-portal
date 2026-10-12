import { Response } from 'express';
import pool from '../../config/database';
import { AuthRequest } from '../../middlewares/auth';
import { success, created, error } from '../../utils/response';
import { put } from '@vercel/blob';

const ALLOWED_AUDIO_TYPES = [
  'audio/webm',
  'audio/webm;codecs=opus',
  'audio/ogg',
  'audio/ogg;codecs=opus',
  'audio/mp3',
  'audio/mpeg',
  'audio/wav',
  'audio/x-wav',
];

const MAX_VOICE_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const createVoiceRecording = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return error(res, 'No audio file uploaded', 400);
    }

    if (!ALLOWED_AUDIO_TYPES.includes(req.file.mimetype)) {
      return error(res, `Audio type ${req.file.mimetype} is not allowed`, 400);
    }

    if (req.file.size > MAX_VOICE_FILE_SIZE) {
      return error(res, 'Audio file size exceeds 10MB limit', 400);
    }

    const { sales_order_id, customer_id, duration_seconds } = req.body;

    if (!sales_order_id && !customer_id) {
      return error(res, 'Either sales_order_id or customer_id is required', 400);
    }

    const blob = await put(req.file.originalname, req.file.buffer, {
      access: 'public',
      addRandomSuffix: true,
    });

    const [result]: any = await pool.query(
      `INSERT INTO sales_voice_recordings (sales_order_id, customer_id, file_url, file_name, mime_type, duration_seconds, file_size_bytes, created_by)
       VALUES (?,?,?,?,?,?,?,?)`,
      [
        sales_order_id || null,
        customer_id || null,
        blob.url,
        req.file.originalname,
        req.file.mimetype,
        duration_seconds ? parseInt(duration_seconds) : null,
        req.file.size,
        req.user?.id || null,
      ]
    );

    const [recording]: any = await pool.query(
      `SELECT svr.*, CONCAT(u.first_name, ' ', u.last_name) as created_by_name
       FROM sales_voice_recordings svr
       LEFT JOIN users u ON svr.created_by = u.id
       WHERE svr.id = ?`,
      [result.insertId]
    );

    return created(res, recording[0], 'Voice recording saved');
  } catch (err: any) {
    return error(res, err.message);
  }
};

export const getVoiceRecordings = async (req: AuthRequest, res: Response) => {
  try {
    const { order_id, customer_id } = req.query;

    if (!order_id && !customer_id) {
      return error(res, 'Either order_id or customer_id is required', 400);
    }

    let where = 'WHERE svr.deleted_at IS NULL';
    const params: any[] = [];

    if (order_id) {
      where += ' AND svr.sales_order_id = ?';
      params.push(order_id);
    }

    if (customer_id) {
      where += ' AND svr.customer_id = ?';
      params.push(customer_id);
    }

    const [rows]: any = await pool.query(
      `SELECT svr.*, CONCAT(u.first_name, ' ', u.last_name) as created_by_name
       FROM sales_voice_recordings svr
       LEFT JOIN users u ON svr.created_by = u.id
       ${where} ORDER BY svr.created_at DESC`,
      params
    );

    return success(res, rows);
  } catch (err: any) {
    return error(res, err.message);
  }
};

export const deleteVoiceRecording = async (req: AuthRequest, res: Response) => {
  try {
    const [old]: any = await pool.query('SELECT * FROM sales_voice_recordings WHERE id = ?', [req.params.id]);
    if (old.length === 0) return error(res, 'Voice recording not found', 404);

    await pool.query('UPDATE sales_voice_recordings SET deleted_at = NOW() WHERE id = ?', [req.params.id]);
    return success(res, null, 'Voice recording deleted');
  } catch (err: any) {
    return error(res, err.message);
  }
};