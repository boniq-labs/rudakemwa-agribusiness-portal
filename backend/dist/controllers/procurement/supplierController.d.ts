import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth';
export declare const getSupplierCategories: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createSupplierCategory: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateSupplierCategory: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getSuppliers: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createSupplier: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateSupplier: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteSupplier: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const rateSupplier: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=supplierController.d.ts.map