import axios from 'axios';
import crypto from 'crypto';
import { ENV } from '../config/env';
import { ApiError } from '../utils/apiError';

export interface InitializePaymentParams {
  email: string;
  amount: number; // in kobo or full naira (Paystack takes kobo: amount * 100)
  reference: string;
  callbackUrl?: string;
  metadata?: Record<string, any>;
}

export class PaystackService {
  private static readonly BASE_URL = 'https://api.paystack.co';

  private static get headers() {
    return {
      Authorization: `Bearer ${ENV.PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    };
  }

  static async initializePayment(params: InitializePaymentParams) {
    try {
      const response = await axios.post(
        `${this.BASE_URL}/transaction/initialize`,
        {
          email: params.email,
          amount: Math.round(params.amount * 100), // convert to kobo
          reference: params.reference,
          callback_url: params.callbackUrl,
          metadata: params.metadata,
        },
        { headers: this.headers }
      );
      return response.data.data;
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to initialize Paystack payment';
      throw ApiError.badRequest(msg);
    }
  }

  static async verifyPayment(reference: string) {
    try {
      const response = await axios.get(
        `${this.BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`,
        { headers: this.headers }
      );
      return response.data.data;
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to verify Paystack payment';
      throw ApiError.badRequest(msg);
    }
  }

  static verifyWebhookSignature(signature: string, payload: any): boolean {
    const hash = crypto
      .createHmac('sha512', ENV.PAYSTACK_SECRET_KEY)
      .update(typeof payload === 'string' ? payload : JSON.stringify(payload))
      .digest('hex');
    return hash === signature;
  }
}
