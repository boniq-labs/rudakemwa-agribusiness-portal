import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth';
export declare const getTrips: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createTrip: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateTrip: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteTrip: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateTripStatus: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=tripController.d.ts.map