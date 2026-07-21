import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth';
export declare const getSalesOrders: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createSalesOrder: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateSalesOrderStatus: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getQuotations: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createQuotation: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const convertQuotationToOrder: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getSalesReturns: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createSalesReturn: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=orderController.d.ts.map