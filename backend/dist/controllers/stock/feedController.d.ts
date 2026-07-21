import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth';
export declare const getFeedItems: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createFeedItem: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateFeedItem: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteFeedItem: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getFeedConsumption: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const recordFeedConsumption: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getFeedStockReport: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=feedController.d.ts.map