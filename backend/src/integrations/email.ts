import nodemailer from 'nodemailer';
import { ENV } from '../config/env';

export class EmailService {
  private static transporter = nodemailer.createTransport({
    host: ENV.EMAIL_HOST,
    port: ENV.EMAIL_PORT,
    secure: ENV.EMAIL_PORT === 465,
    auth: ENV.EMAIL_USER
      ? {
          user: ENV.EMAIL_USER,
          pass: ENV.EMAIL_PASSWORD,
        }
      : undefined,
  });

  static async sendEmail(to: string, subject: string, html: string, text?: string) {
    if (!ENV.EMAIL_HOST) {
      console.log(`[Email Mock] To: ${to} | Subject: ${subject}`);
      return;
    }
    try {
      await this.transporter.sendMail({
        from: ENV.EMAIL_FROM,
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]+>/g, ''),
      });
    } catch (error) {
      console.error('[EmailService Error]:', error);
    }
  }

  static async sendOrderConfirmation(to: string, orderNumber: string, total: string) {
    const html = `
      <h2>Thank you for your order!</h2>
      <p>Your order <strong>#${orderNumber}</strong> with total <strong>?${total}</strong> has been received and is being processed.</p>
    `;
    await this.sendEmail(to, `NOBELLE - Order Confirmation #${orderNumber}`, html);
  }
}
