import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth';
export declare const getBreedingRecords: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createBreedingRecord: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateBreedingRecord: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getPregnancies: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createPregnancy: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updatePregnancy: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deletePregnancy: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getBirthRecords: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createBirthRecord: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateBirthRecord: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteBirthRecord: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=breedingController.d.ts.map