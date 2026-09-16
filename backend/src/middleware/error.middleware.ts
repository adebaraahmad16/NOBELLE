import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/apiError';
import { ENV } from '../config/env';

export function errorHandler(
  err: Error | ApiError,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  let statusCode = 500;
  let message = 'Internal server error';
  let errors: any[] | undefined = undefined;

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    errors = err.errors;
  } else if (err.name === 'PrismaClientKnownRequestError') {
    const prismaErr = err as any;
    if (prismaErr.code === 'P2002') {
      statusCode = 409;
      message = 'A record with this unique value already exists';
    } else if (prismaErr.code === 'P2025') {
      statusCode = 404;
      message = 'Record to update/delete was not found';
    }
  }

  if (ENV.NODE_ENV === 'development') {
    console.error('[Error Details]:', err);
  }

  return res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors }),
  });
}
