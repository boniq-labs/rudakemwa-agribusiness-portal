import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth';
export declare const getDrivers: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createDriver: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateDriver: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteDriver: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getDriverHistory: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=driverController.d.ts.map