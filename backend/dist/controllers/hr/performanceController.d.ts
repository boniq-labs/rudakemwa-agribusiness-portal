import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth';
export declare const getPerformanceReviews: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createPerformanceReview: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updatePerformanceReview: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=performanceController.d.ts.map