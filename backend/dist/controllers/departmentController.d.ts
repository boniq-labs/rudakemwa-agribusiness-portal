import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
export declare const getDepartments: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createDepartment: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateDepartment: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteDepartment: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=departmentController.d.ts.map