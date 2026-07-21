import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth';
export declare const getEquipment: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createEquipment: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateEquipment: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteEquipment: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createEquipmentMaintenance: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=equipmentController.d.ts.map