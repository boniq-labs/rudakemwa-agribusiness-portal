import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth';
export declare const getStorageTanks: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createStorageTank: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateStorageTank: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getMilkStorage: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const addMilkToStorage: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getStorageReport: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=milkStorageController.d.ts.map