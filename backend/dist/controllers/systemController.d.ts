import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
export declare const getSystemHealth: (req: AuthRequest, res: Response) => Promise<void>;
export declare const createBackup: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const listBackups: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const restoreBackup: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=systemController.d.ts.map