import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth';
export declare const getPurchaseRequests: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createPurchaseRequest: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const approvePurchaseRequest: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const rejectPurchaseRequest: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updatePurchaseRequest: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deletePurchaseRequest: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=purchaseRequestController.d.ts.map