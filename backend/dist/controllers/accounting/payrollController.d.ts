import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth';
export declare const getPayrollRecords: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createPayroll: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const processPayrollPayment: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getSalaryRecords: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createSalaryRecord: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=payrollController.d.ts.map