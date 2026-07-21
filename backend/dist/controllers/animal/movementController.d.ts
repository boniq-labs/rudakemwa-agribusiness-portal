import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth';
export declare const getAnimalTransfers: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createAnimalTransfer: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getAnimalPurchases: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createAnimalPurchase: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getAnimalSales: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createAnimalSale: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getAnimalDeaths: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createAnimalDeath: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getWeightRecords: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createWeightRecord: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateWeightRecord: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteWeightRecord: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateAnimalSale: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteAnimalSale: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateAnimalDeath: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteAnimalDeath: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=movementController.d.ts.map