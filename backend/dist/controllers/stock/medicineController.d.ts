import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth';
export declare const getMedicines: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createMedicine: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateMedicine: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getExpiringMedicines: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getExpiredMedicines: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=medicineController.d.ts.map