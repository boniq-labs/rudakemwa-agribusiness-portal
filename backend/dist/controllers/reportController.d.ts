import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
export declare const submitReport: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getMyReports: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getDepartmentReports: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const approveReport: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const rejectReport: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=reportController.d.ts.map