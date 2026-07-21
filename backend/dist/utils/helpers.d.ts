export declare const hashPassword: (password: string) => Promise<string>;
export declare const comparePassword: (password: string, hash: string) => Promise<boolean>;
export declare const generateCode: (prefix: string) => string;
export declare const sanitizeUser: (user: any) => any;
//# sourceMappingURL=helpers.d.ts.map