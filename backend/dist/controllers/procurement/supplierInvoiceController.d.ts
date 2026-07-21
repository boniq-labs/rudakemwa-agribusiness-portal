import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth';
export declare const getSupplierInvoices: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createSupplierInvoice: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const recordSupplierPayment: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getSupplierContracts: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createSupplierContract: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateSupplierContract: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getExpiringContracts: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=supplierInvoiceController.d.ts.map