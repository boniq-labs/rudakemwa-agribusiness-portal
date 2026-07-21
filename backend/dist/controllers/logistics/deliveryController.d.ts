import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth';
export declare const getDeliveries: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createDelivery: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateDelivery: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteDelivery: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateDeliveryStatus: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=deliveryController.d.ts.map