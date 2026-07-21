import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth';
export declare const getSalesInvoices: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createSalesInvoice: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const recordCustomerPayment: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=invoiceController.d.ts.map