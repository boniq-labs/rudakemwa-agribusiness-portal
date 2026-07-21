import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth';
export declare const getPositions: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createPosition: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updatePosition: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deletePosition: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=positionController.d.ts.map