import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth';
export declare const getFuelRecords: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createFuelRecord: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateFuelRecord: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteFuelRecord: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=fuelController.d.ts.map