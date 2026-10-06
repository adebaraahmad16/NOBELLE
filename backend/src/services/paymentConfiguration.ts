import { ENV } from '../config/env';
export type PaymentMode = 'TEST'|'LIVE';
export function paymentCredentials(mode: PaymentMode) {
 const tag=mode.toLowerCase();
 const legacyMatches=ENV.PAYSTACK_SECRET_KEY.startsWith(`sk_${tag}_`);
 const secret=(mode==='LIVE'?process.env.PAYSTACK_LIVE_SECRET_KEY:process.env.PAYSTACK_TEST_SECRET_KEY) || (legacyMatches?ENV.PAYSTACK_SECRET_KEY:'');
 const publicKey=(mode==='LIVE'?process.env.PAYSTACK_LIVE_PUBLIC_KEY:process.env.PAYSTACK_TEST_PUBLIC_KEY) || (legacyMatches?ENV.PAYSTACK_PUBLIC_KEY:'');
 return {secret,publicKey};
}
export function paymentModeDefault():PaymentMode {return ENV.PAYSTACK_SECRET_KEY.startsWith('sk_live_') || (!paymentCredentials('TEST').secret && Boolean(paymentCredentials('LIVE').secret))?'LIVE':'TEST';}
export function paymentCapabilities(){return {provider:'Paystack',modes:(['TEST','LIVE'] as const).map(mode=>({mode,configured:Boolean(paymentCredentials(mode).secret),publicKey:/^pk_(test|live)_/.test(paymentCredentials(mode).publicKey)?paymentCredentials(mode).publicKey:''})),currencies:(process.env.PAYSTACK_SUPPORTED_CURRENCIES || 'NGN').split(',').map(s=>s.trim().toUpperCase()).filter(Boolean),channels:['card','bank_transfer'],twoFactorSupported:false};}
