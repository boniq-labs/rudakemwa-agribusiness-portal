import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth';
export declare const getTrainings: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createTraining: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateTraining: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getTrainingParticipants: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const enrollParticipant: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateParticipantStatus: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=trainingController.d.ts.map