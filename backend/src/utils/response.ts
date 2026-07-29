import { Response } from 'express';
import logger from './logger';

export function success(res: Response, data: any = null, message = 'Success', status = 200) {
  return res.status(status).json({ success: true, message, data });
}

export function created(res: Response, data: any = null, message = 'Created successfully') {
  return success(res, data, message, 201);
}

export function paginated(res: Response, data: any[], total: number, page: number, limit: number) {
  return res.status(200).json({
    success: true,
    data,
    pagination: { total, page, limit, pages: Math.ceil(total / limit) },
  });
}

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public errors: string[] = []
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function error(res: Response, message = 'Internal server error', status = 500, errors: string[] = []) {
  if (status >= 500) {
    logger.error({ message, status, url: (res.req as any)?.originalUrl, method: (res.req as any)?.method });
  } else if (status >= 400) {
    logger.warn({ message, status, url: (res.req as any)?.originalUrl, method: (res.req as any)?.method });
  }
  return res.status(status).json({ success: false, message, errors });
}
