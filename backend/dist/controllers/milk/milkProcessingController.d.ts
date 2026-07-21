import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth';
export declare const getProcessingRecords: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createProcessingRecord: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getMilkProducts: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createMilkProduct: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateMilkProduct: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=milkProcessingController.d.ts.map