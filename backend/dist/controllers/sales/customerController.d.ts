import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth';
export declare const getCustomers: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createCustomer: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateCustomer: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteCustomer: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=customerController.d.ts.map