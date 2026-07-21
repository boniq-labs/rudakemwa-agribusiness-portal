import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth';
export declare const getWasteRecords: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createWasteRecord: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=milkWasteController.d.ts.map