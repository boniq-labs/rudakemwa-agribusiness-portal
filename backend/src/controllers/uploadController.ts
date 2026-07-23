import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { success, error } from '../utils/response';

export const uploadFile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) return error(res, 'No file uploaded', 400);
    const url = `/uploads/${req.file.filename}`;
    return success(res, { url, filename: req.file.filename }, 'File uploaded successfully');
  } catch (err: any) { return error(res, err.message); }
};
