import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
export declare const getRoles: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createRole: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateRole: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteRole: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=roleController.d.ts.map