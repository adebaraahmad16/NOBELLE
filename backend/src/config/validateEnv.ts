import { ENV } from './env';
export function validateEnvironment() {
  if (!/^mysql:\/\//.test(ENV.DATABASE_URL)) throw new Error('DATABASE_URL must point to MySQL');
  for (const secret of [ENV.JWT_ACCESS_SECRET, ENV.JWT_REFRESH_SECRET]) {
    if (secret.length < 32 || /your-|change-in|nobelle-jwt/i.test(secret)) throw new Error('Configure strong JWT secrets with at least 32 characters');
  }
  if (ENV.JWT_ACCESS_SECRET === ENV.JWT_REFRESH_SECRET) throw new Error('JWT secrets must differ');
  if (ENV.NODE_ENV === 'production') {
    for (const url of [ENV.FRONTEND_URL, ENV.ADMIN_URL]) if (!url.startsWith('https://')) throw new Error('Production frontend origins require HTTPS');
    if (!ENV.PAYSTACK_SECRET_KEY.startsWith('sk_live_') && !process.env.PAYSTACK_LIVE_SECRET_KEY?.startsWith('sk_live_')) throw new Error('Production requires a live Paystack key');
    if (!ENV.EMAIL_HOST) throw new Error('Configure the production email provider');
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) throw new Error('Configure image storage');
  }
}
