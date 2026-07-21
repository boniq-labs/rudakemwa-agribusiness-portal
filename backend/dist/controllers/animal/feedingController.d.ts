import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth';
export declare const getFeedingRecords: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createFeedingRecord: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getFeedConsumptionReport: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=feedingController.d.ts.map