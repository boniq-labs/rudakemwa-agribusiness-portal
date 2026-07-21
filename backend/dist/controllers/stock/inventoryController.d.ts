import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth';
export declare const getInventoryCategories: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createInventoryCategory: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateInventoryCategory: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getInventoryItems: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createInventoryItem: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateInventoryItem: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteInventoryItem: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getLowStockItems: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getStockValue: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=inventoryController.d.ts.map