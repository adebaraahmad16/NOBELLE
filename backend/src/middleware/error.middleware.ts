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
    } else if (prismaErr.code === 'P2003') {
      statusCode = 409;
      message = 'This record has related data or references an unavailable record';
    } else if (prismaErr.code === 'P2004') {
      statusCode = 422;
      message = 'The record does not meet the required constraints';
    } else if (prismaErr.code === 'P2034') {
      statusCode = 409;
      message = 'A concurrent update occurred. Please retry';
    }
  }

  if (err.name === 'MulterError') { statusCode = 422; message = 'Upload limit exceeded. Use at most 10 images, each under 5 MB.'; }
  if (err.name === 'SyntaxError' && (err as any).status === 400) { statusCode = 400; message = 'Invalid JSON request'; }
  if (ENV.NODE_ENV === 'development') {
    console.error('[Error Details]:', err);
  }

  return res.status(statusCode).json({
    success: false,
    message,
    errors: errors || [],
  });
}
