import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
export declare const getBranches: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createBranch: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateBranch: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteBranch: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=branchController.d.ts.map