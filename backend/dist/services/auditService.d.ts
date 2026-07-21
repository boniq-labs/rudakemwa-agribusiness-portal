import { AuthRequest } from '../middlewares/auth';
export interface AuditEntry {
    userId: number | null;
    action: string;
    module: string;
    description: string;
    previousValues?: any;
    newValues?: any;
    ipAddress?: string;
    userAgent?: string;
}
export declare function logAudit(req: AuthRequest | null, entry: Omit<AuditEntry, 'ipAddress' | 'userAgent'>): Promise<void>;
export declare function createAuditEntry(req: AuthRequest, action: string, module: string, description: string, newValues?: any, previousValues?: any): Omit<AuditEntry, 'ipAddress' | 'userAgent'>;
//# sourceMappingURL=auditService.d.ts.map