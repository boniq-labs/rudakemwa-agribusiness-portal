import bcrypt from 'bcryptjs';
export const hashPassword = (password) => bcrypt.hash(password, 12);
export const comparePassword = (password, hash) => bcrypt.compare(password, hash);
export const generateCode = (prefix) => `${prefix}${Date.now()}${Math.floor(Math.random() * 1000)}`;
export const sanitizeUser = (user) => {
    const { password, refresh_token, ...safe } = user;
    return safe;
};
//# sourceMappingURL=helpers.js.map