import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
export declare const getNotifications: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const markAsRead: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const markAllAsRead: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare function createNotification(userId: number, type: string, title: string, message: string, link?: string): Promise<void>;
//# sourceMappingURL=notificationController.d.ts.map