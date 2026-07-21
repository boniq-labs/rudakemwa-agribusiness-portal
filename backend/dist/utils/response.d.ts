import { Response } from 'express';
export declare function success(res: Response, data?: any, message?: string, status?: number): Response<any, Record<string, any>>;
export declare function created(res: Response, data?: any, message?: string): Response<any, Record<string, any>>;
export declare function paginated(res: Response, data: any[], total: number, page: number, limit: number): Response<any, Record<string, any>>;
export declare class AppError extends Error {
    statusCode: number;
    message: string;
    errors: string[];
    constructor(statusCode: number, message: string, errors?: string[]);
}
export declare function error(res: Response, message?: string, status?: number, errors?: string[]): Response<any, Record<string, any>>;
//# sourceMappingURL=response.d.ts.map