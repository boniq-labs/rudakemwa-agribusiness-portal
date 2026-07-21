import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth';
export declare const getQualityTests: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createQualityTest: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getQualityAlerts: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteQualityTest: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=milkQualityController.d.ts.map