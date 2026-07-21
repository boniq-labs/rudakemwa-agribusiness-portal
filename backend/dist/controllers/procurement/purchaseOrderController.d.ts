import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth';
export declare const getPurchaseOrders: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createPurchaseOrder: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updatePurchaseOrder: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updatePurchaseOrderStatus: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deletePurchaseOrder: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const receivePurchaseOrder: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=purchaseOrderController.d.ts.map