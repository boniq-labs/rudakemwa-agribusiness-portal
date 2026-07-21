import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth';
export declare const getExpenseCategories: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createExpenseCategory: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateExpenseCategory: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getExpenseRecords: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createExpenseRecord: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateExpenseRecord: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteExpenseRecord: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getExpenseSummary: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=expenseController.d.ts.map