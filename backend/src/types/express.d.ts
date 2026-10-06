import { AuthUser } from './index';

declare global {
  namespace Express {
    interface Request {
      cartOwner?: string;
      user?: AuthUser;
      admin?: AuthUser;
      rawBody?: Buffer;
    }
  }
}
