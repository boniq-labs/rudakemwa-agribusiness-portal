interface EmailOptions {
    to: string;
    subject: string;
    text?: string;
    html?: string;
}
export declare function sendEmail(options: EmailOptions): Promise<any>;
export declare function sendWelcomeEmail(email: string, name: string, username: string, password: string): Promise<any>;
export declare function sendPasswordResetEmail(email: string, resetLink: string): Promise<any>;
export declare function sendNotificationEmail(email: string, title: string, message: string): Promise<any>;
export {};
//# sourceMappingURL=emailService.d.ts.map