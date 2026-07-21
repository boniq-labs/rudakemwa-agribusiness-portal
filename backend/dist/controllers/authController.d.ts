import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
export declare const login: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const refreshTokenHandler: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getProfile: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const changePassword: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateProfile: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const logout: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=authController.d.ts.map