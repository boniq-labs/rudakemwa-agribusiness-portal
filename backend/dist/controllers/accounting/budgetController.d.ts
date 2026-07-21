import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth';
export declare const getBudgets: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createBudget: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateBudgetStatus: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getBudgetVsActual: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=budgetController.d.ts.map