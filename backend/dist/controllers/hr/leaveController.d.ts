import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth';
export declare const getLeaveTypes: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createLeaveType: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateLeaveType: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getLeaveRequests: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createLeaveRequest: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const approveLeave: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const rejectLeave: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const cancelLeave: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=leaveController.d.ts.map