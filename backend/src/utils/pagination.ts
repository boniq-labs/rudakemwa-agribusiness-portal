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

export function getPagination(req: Request): PaginationParams {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(10000, Math.max(1, parseInt(req.query.limit as string) || 25));
  const sort = (req.query.sort as string) || 'created_at';
  const order = (req.query.order as string)?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
  const search = (req.query.search as string) || '';

  const filters: Record<string, any> = {};
  for (const [key, value] of Object.entries(req.query)) {
    if (!['page', 'limit', 'sort', 'order', 'search'].includes(key) && typeof value === 'string') {
      filters[key] = value;
    }
  }

  return { page, limit, offset: (page - 1) * limit, sort, order, search, filters };
}

export function buildWhereClause(
  filters: Record<string, any>,
  search: string,
  searchFields: string[] = []
): { where: string; params: any[] } {
  const conditions: string[] = [];
  const params: any[] = [];

  for (const [key, value] of Object.entries(filters)) {
    if (value && value !== '') {
      conditions.push(`${key} = ?`);
      params.push(value);
    }
  }

  if (search && searchFields.length > 0) {
    const searchConditions = searchFields.map((f) => `${f} LIKE ?`);
    conditions.push(`(${searchConditions.join(' OR ')})`);
    searchFields.forEach(() => params.push(`%${search}%`));
  }

  return {
    where: conditions.length > 0 ? ` AND ${conditions.join(' AND ')}` : '',
    params,
  };
}
