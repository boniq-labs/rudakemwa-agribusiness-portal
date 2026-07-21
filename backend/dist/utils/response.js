export function success(res, data = null, message = 'Success', status = 200) {
    return res.status(status).json({ success: true, message, data });
}
export function created(res, data = null, message = 'Created successfully') {
    return success(res, data, message, 201);
}
export function paginated(res, data, total, page, limit) {
    return res.status(200).json({
        success: true,
        data,
        pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
}
export class AppError extends Error {
    statusCode;
    message;
    errors;
    constructor(statusCode, message, errors = []) {
        super(message);
        this.statusCode = statusCode;
        this.message = message;
        this.errors = errors;
        this.name = 'AppError';
    }
}
export function error(res, message = 'Internal server error', status = 500, errors = []) {
    return res.status(status).json({ success: false, message, errors });
}
//# sourceMappingURL=response.js.map