import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth';
export declare const getVehicleTypes: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createVehicleType: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getVehicles: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createVehicle: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateVehicle: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteVehicle: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=vehicleController.d.ts.map