import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth';
export declare const getMilkCollections: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createMilkCollection: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateMilkCollection: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteMilkCollection: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getDailyProduction: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getMonthlyProduction: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=milkCollectionController.d.ts.map