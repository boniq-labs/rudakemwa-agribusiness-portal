import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth';
export declare const getAttendance: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const checkIn: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const checkOut: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getAttendanceReport: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=attendanceController.d.ts.map