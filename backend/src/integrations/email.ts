import nodemailer from 'nodemailer';
import { ENV } from '../config/env';

export class EmailService {
  private static transporter = nodemailer.createTransport({
    host: ENV.EMAIL_HOST,
    port: ENV.EMAIL_PORT,
    secure: ENV.EMAIL_PORT === 465,
    requireTLS: ENV.NODE_ENV === 'production',
    disableFileAccess: true, disableUrlAccess: true,
    connectionTimeout: 15000, greetingTimeout: 15000, socketTimeout: 30000,
    auth: ENV.EMAIL_USER
      ? {
          user: ENV.EMAIL_USER,
          pass: ENV.EMAIL_PASSWORD,
        }
      : undefined,
  });

  static async sendEmail(to: string, subject: string, html: string, text?: string) {
    if (!ENV.EMAIL_HOST) throw new Error('Email provider is not configured');
    await this.transporter.sendMail({ from: ENV.EMAIL_FROM, to, subject, html,
      text: text || html.replace(/<[^>]+>/g, '') });
  }

  static async sendOrderConfirmation(to: string, orderNumber: string, total: string) {
    const html = `
      <h2>Thank you for your order!</h2>
      <p>Your order <strong>#${orderNumber}</strong> with total <strong>?${total}</strong> has been received and is being processed.</p>
    `;
    await this.sendEmail(to, `NOBELLE - Order Confirmation #${orderNumber}`, html);
  }
}
