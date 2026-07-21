import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth';
export declare const getHealthRecords: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createHealthRecord: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getVaccinationSchedule: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createVaccinationSchedule: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getVaccinationRecords: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createVaccinationRecord: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getDueVaccinations: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getTreatmentPrescriptions: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createTreatmentPrescription: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=healthController.d.ts.map