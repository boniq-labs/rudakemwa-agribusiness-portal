import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth';
export declare const getVaccinations: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createVaccination: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateVaccination: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteVaccination: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getDiseases: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createDisease: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateDiseaseStatus: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateDisease: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteDisease: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getTreatments: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createTreatment: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateTreatment: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteTreatment: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=healthController.d.ts.map