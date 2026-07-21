import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth';
export declare const getContracts: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createContract: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateContract: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const terminateContract: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getExpiringContracts: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=contractController.d.ts.map