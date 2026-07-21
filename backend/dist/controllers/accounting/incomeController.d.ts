import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth';
export declare const getIncomeRecords: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createIncomeRecord: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateIncomeRecord: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteIncomeRecord: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getIncomeSummary: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=incomeController.d.ts.map