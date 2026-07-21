import bcrypt from 'bcryptjs';

export const hashPassword = (password: string): Promise<string> => bcrypt.hash(password, 12);
export const comparePassword = (password: string, hash: string): Promise<boolean> => bcrypt.compare(password, hash);

export const generateCode = (prefix: string): string => `${prefix}${Date.now()}${Math.floor(Math.random() * 1000)}`;

export const sanitizeUser = (user: any) => {
  const { password, refresh_token, ...safe } = user;
  return safe;
};
