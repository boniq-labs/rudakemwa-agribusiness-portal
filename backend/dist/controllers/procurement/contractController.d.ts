import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth';
export declare const getProcurementContracts: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createProcurementContract: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateProcurementContract: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getExpiringProcurementContracts: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=contractController.d.ts.map