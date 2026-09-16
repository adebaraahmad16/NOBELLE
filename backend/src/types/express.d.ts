import { AuthUser } from './index';

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      admin?: AuthUser;
      rawBody?: Buffer;
    }
  }
}
