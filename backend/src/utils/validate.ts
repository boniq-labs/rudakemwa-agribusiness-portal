import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { AppError } from './response';

type ValidationTarget = 'body' | 'query' | 'params';

export function validate(schema: ZodSchema, target: ValidationTarget = 'body') {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      const errors = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
      throw new AppError(400, 'Validation error', errors);
    }
    req[target] = result.data;
    next();
  };
}
