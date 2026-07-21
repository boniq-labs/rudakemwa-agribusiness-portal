import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth';
export declare const getHRReports: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getTasks: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=reportController.d.ts.map