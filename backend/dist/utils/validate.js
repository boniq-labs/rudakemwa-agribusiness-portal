import { AppError } from './response';
export function validate(schema, target = 'body') {
    return (req, res, next) => {
        const result = schema.safeParse(req[target]);
        if (!result.success) {
            const errors = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
            throw new AppError(400, 'Validation error', errors);
        }
        req[target] = result.data;
        next();
    };
}
//# sourceMappingURL=validate.js.map