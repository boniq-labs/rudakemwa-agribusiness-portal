import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/response';
import logger from '../utils/logger';

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors,
    });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: err.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
    });
  }

  logger.error({
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
  });

  return res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
    errors: [],
  });
}

export function notFound(req: Request, res: Response) {
  return res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found`, errors: [] });
}
