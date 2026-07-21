import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth';
export declare const getTransportRequests: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createTransportRequest: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const approveTransportRequest: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const rejectTransportRequest: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=transportController.d.ts.map