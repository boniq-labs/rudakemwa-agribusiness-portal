import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth';
export declare const getMaintenanceRecords: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createMaintenanceRecord: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getDueMaintenance: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=maintenanceController.d.ts.map