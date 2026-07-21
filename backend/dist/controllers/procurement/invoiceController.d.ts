import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth';
export declare const getProcurementInvoices: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createProcurementInvoice: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const payProcurementInvoice: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=invoiceController.d.ts.map