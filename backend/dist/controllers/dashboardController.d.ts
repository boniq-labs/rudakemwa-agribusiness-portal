import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
export declare const getDashboard: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getDepartmentOverview: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=dashboardController.d.ts.map