import { Request, Response, NextFunction } from 'express';
export declare function errorHandler(err: Error, req: Request, res: Response, next: NextFunction): Response<any, Record<string, any>>;
export declare function notFound(req: Request, res: Response): Response<any, Record<string, any>>;
//# sourceMappingURL=errorHandler.d.ts.map