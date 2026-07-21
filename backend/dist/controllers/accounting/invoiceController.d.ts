import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth';
export declare const getInvoices: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createInvoice: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateInvoiceStatus: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const recordPayment: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getInvoicePDF: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=invoiceController.d.ts.map