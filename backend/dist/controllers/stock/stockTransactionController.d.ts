import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth';
export declare const receiveStock: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const issueStock: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const transferStock: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const adjustStock: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getStockMovements: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=stockTransactionController.d.ts.map