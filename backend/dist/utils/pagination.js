export function getPagination(req) {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 25));
    const sort = req.query.sort || 'created_at';
    const order = req.query.order?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    const search = req.query.search || '';
    const filters = {};
    for (const [key, value] of Object.entries(req.query)) {
        if (!['page', 'limit', 'sort', 'order', 'search'].includes(key) && typeof value === 'string') {
            filters[key] = value;
        }
    }
    return { page, limit, offset: (page - 1) * limit, sort, order, search, filters };
}
export function buildWhereClause(filters, search, searchFields = []) {
    const conditions = [];
    const params = [];
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
        where: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
        params,
    };
}
//# sourceMappingURL=pagination.js.map