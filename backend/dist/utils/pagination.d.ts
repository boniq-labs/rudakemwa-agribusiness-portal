import { Request } from 'express';
export interface PaginationParams {
    page: number;
    limit: number;
    offset: number;
    sort: string;
    order: 'ASC' | 'DESC';
    search: string;
    filters: Record<string, any>;
}
export declare function getPagination(req: Request): PaginationParams;
export declare function buildWhereClause(filters: Record<string, any>, search: string, searchFields?: string[]): {
    where: string;
    params: any[];
};
//# sourceMappingURL=pagination.d.ts.map