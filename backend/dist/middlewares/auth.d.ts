import { Request, Response, NextFunction } from 'express';
export interface AuthRequest extends Request {
    user?: {
        id: number;
        username: string;
        role: string;
        roleId: number;
        departmentId: number | null;
        permissions: string[];
    };
}
export declare const authenticate: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const authorize: (requiredPermissions: string[]) => (req: AuthRequest, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
export declare const hasRole: (...roles: string[]) => (req: AuthRequest, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
//# sourceMappingURL=auth.d.ts.map