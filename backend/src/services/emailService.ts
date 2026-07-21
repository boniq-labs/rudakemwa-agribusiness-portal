import nodemailer from 'nodemailer';
import logger from '../utils/logger';

let transporter: nodemailer.Transporter;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER || '',
        pass: process.env.EMAIL_PASSWORD || '',
      },
    });
  }
  return transporter;
}

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(options: EmailOptions) {
  try {
    const info = await getTransporter().sendMail({
      from: `"EFMS" <${process.env.EMAIL_FROM || 'noreply@efms.com'}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });
    logger.info(`Email sent to ${options.to}: ${info.messageId}`);
    return info;
  } catch (err) {
    logger.error(`Email failed to ${options.to}: ${err}`);
    throw err;
  }
}

export function sendWelcomeEmail(email: string, name: string, username: string, password: string) {
  return sendEmail({
    to: email,
    subject: 'Welcome to EFMS - Your Account Details',
    html: `
      <h2>Welcome to Enterprise Farm Management System</h2>
      <p>Dear ${name},</p>
      <p>Your account has been created successfully.</p>
      <p><strong>Login Details:</strong></p>
      <ul>
        <li>Username: ${username}</li>
        <li>Password: ${password}</li>
      </ul>
      <p>Please change your password after first login.</p>
      <p><a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login">Login Here</a></p>
    `,
  });
}

export function sendPasswordResetEmail(email: string, resetLink: string) {
  return sendEmail({
    to: email,
    subject: 'EFMS - Password Reset Request',
    html: `<p>Click <a href="${resetLink}">here</a> to reset your password. This link expires in 1 hour.</p>`,
  });
}

export function sendNotificationEmail(email: string, title: string, message: string) {
  return sendEmail({
    to: email,
    subject: `EFMS - ${title}`,
    html: `<p>${message}</p>`,
  });
}
