import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth';
export declare const getCropTypes: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createCropType: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateCropType: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteCropType: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getLandAreas: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createLandArea: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateLandArea: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteLandArea: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getCropActivities: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createCropActivity: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateCropActivity: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteCropActivity: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getCropDashboard: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=cropController.d.ts.map