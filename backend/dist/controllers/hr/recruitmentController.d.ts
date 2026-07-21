import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth';
export declare const getJobs: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createJob: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateJob: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const closeJob: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getApplicants: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createApplicant: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateApplicantStatus: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=recruitmentController.d.ts.map