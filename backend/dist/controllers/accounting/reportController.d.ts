import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth';
export declare const getProfitLoss: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getCashFlow: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getFinancialSummary: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=reportController.d.ts.map