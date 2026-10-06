import axios from 'axios';
import crypto from 'crypto';
import { ENV } from '../config/env';
import { paymentCredentials, paymentModeDefault, type PaymentMode } from '../services/paymentConfiguration';
import { ApiError } from '../utils/apiError';

export interface InitializePaymentParams {
  mode?: PaymentMode;
  currency?: string;
  channels?: string[];
  email: string;
  amount: number; // integer kobo
  reference: string;
  callbackUrl?: string;
  metadata?: Record<string, any>;
}

export class PaystackService {
  private static readonly BASE_URL = 'https://api.paystack.co';

  private static headers(mode?: PaymentMode) {
    return {
      Authorization: `Bearer ${mode ? paymentCredentials(mode).secret : ENV.PAYSTACK_SECRET_KEY || paymentCredentials(paymentModeDefault()).secret}`,
      'Content-Type': 'application/json',
    };
  }

  static async initializePayment(params: InitializePaymentParams) {
    try {
      const response = await axios.post(
        `${this.BASE_URL}/transaction/initialize`,
        {
          email: params.email,
          amount: params.amount, // integer kobo
          currency: params.currency || 'NGN',
          channels: params.channels,
          reference: params.reference,
          callback_url: params.callbackUrl,
          metadata: params.metadata,
        },
        { headers: this.headers(params.mode), timeout: 15000 }
      );
      return response.data.data;
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to initialize Paystack payment';
      throw ApiError.badRequest(msg);
    }
  }

  static async verifyPayment(reference: string, mode?: PaymentMode) {
    try {
      const response = await axios.get(
        `${this.BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`,
        { headers: this.headers(mode), timeout: 15000 }
      );
      return response.data.data;
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to verify Paystack payment';
      throw ApiError.badRequest(msg);
    }
  }

  static verifyWebhookSignature(signature: string, payload: Buffer): boolean {
    if (!Buffer.isBuffer(payload) || typeof signature !== 'string' || !/^[a-f0-9]{128}$/i.test(signature)) return false;
    const secrets=[ENV.PAYSTACK_SECRET_KEY,paymentCredentials('TEST').secret,paymentCredentials('LIVE').secret].filter(Boolean);
    return secrets.some(secret=>crypto.timingSafeEqual(crypto.createHmac('sha512',secret).update(payload).digest(),Buffer.from(signature,'hex')));
  }
}
