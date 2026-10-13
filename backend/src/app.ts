import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { ENV } from './config/env';
import v1Routes from './routes/v1';
import { errorHandler } from './middleware/error.middleware';
import { rateLimit } from './middleware/rateLimit.middleware';
import { PaymentController } from './controllers/payment.controller';
import openapi from './config/openapi.json';

const app = express();
app.disable('x-powered-by');

// Allow any localhost origin in development, Vercel deployments, or configured origins
const allowedOrigins = [ENV.FRONTEND_URL, ENV.ADMIN_URL];
export const isOriginAllowed = (origin: string) => {
  if (allowedOrigins.includes(origin)) return true;
  if (/^https:\/\/nobelle[a-z0-9-]*\.vercel\.app\/?$/.test(origin)) return true;
  if (ENV.NODE_ENV !== 'production' && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/?$/.test(origin)) return true;
  return false;
};

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && !['GET', 'HEAD', 'OPTIONS'].includes(req.method) && !isOriginAllowed(origin)) {
    res.status(403).json({ success: false, message: 'Origin is not allowed', errors: [] }); return;
  }
  next();
});
if (process.env.TRUST_PROXY === '1') app.set('trust proxy', 1);
app.use((req, res, next) => {
  const started = Date.now();
  const requestPath = req.path;
  res.on('finish', () => console.log(JSON.stringify({ method: req.method,
    path: requestPath, status: res.statusCode, durationMs: Date.now() - started })));
  next();
});

// Security headers
app.use(helmet());

// CORS configuration — accept any localhost port in development
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

// Body parsing with rawBody capture for Paystack webhook signature verification
app.use(
  express.json({
    limit: '256kb',
    verify: (req: Request, _res: Response, buf: Buffer) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true }));
app.use('/api/v1', (_req, res, next) => { res.setHeader('Cache-Control', 'no-store'); next(); });
const authLimiter = rateLimit(20, 15 * 60_000);
app.use(['/api/v1/auth', '/api/v1/admin/auth'], (req, res, next) => {
  if (req.method === 'POST' && ['/login','/register','/forgot-password','/reset-password','/verify-email'].includes(req.path)) return authLimiter(req, res, next);
  next();
});
const contactLimiter = rateLimit(5, 15 * 60_000);
app.use(['/api/v1/contact', '/api/v1/content/contact'], (req, res, next) => {
  if (req.method === 'POST') return contactLimiter(req, res, next);
  next();
});
app.use('/api/v1/newsletter', rateLimit(5, 15 * 60_000));
app.post('/api/v1/webhooks/paystack', PaymentController.webhook);
if (ENV.NODE_ENV !== 'production') {
  app.get('/api/docs/openapi.json', (_req, res) => res.json(openapi));
  app.get('/api/docs', (_req, res) => {
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' https://unpkg.com; style-src 'self' 'unsafe-inline' https://unpkg.com; img-src 'self' data:; connect-src 'self'");
    res.type('html').send('<!doctype html><html><head><title>NOBELLE API</title><link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css"></head><body><div id="swagger-ui"></div><script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script><script>SwaggerUIBundle({url:"/api/docs/openapi.json",dom_id:"#swagger-ui"});</script></body></html>');
  });
}

// Serve static uploads
app.use('/uploads', express.static(path.resolve(ENV.UPLOAD_DIR)));

// Health check
app.get(['/api/health', '/api/v1/health'], (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API versioning
app.use('/api/v1', v1Routes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, message: 'Endpoint not found' });
});

// Centralized error handling
app.use(errorHandler);

export default app;
