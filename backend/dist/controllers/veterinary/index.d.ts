import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth';
export declare const getVeterinaryHealth: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createVeterinaryHealth: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateVeterinaryHealth: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteVeterinaryHealth: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getVaccinationSchedule: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createVaccinationSchedule: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getVetVaccinations: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createVetVaccination: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateVetVaccination: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteVetVaccination: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getDueVaccinations: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getPrescriptions: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createPrescription: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updatePrescription: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deletePrescription: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=index.d.ts.map