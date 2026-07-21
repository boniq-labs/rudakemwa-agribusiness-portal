import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth';
export declare const getProductCategories: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createProductCategory: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateProductCategory: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getProducts: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createProduct: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateProduct: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteProduct: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateProductStock: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=productController.d.ts.map