import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
}

export const errorHandler = (
  err: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', err);

  // Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002':
        return res.status(409).json({
          error: 'Unique constraint violation',
          message: 'A record with this data already exists',
          code: err.code,
        });
      case 'P2025':
        return res.status(404).json({
          error: 'Record not found',
          message: 'The requested resource could not be found',
          code: err.code,
        });
      default:
        return res.status(400).json({
          error: 'Database error',
          message: err.message,
          code: err.code,
        });
    }
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation error',
      message: err.message,
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Invalid token',
      message: 'The provided token is invalid',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token expired',
      message: 'The provided token has expired',
    });
  }

  // Custom API errors
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      error: err.name || 'API Error',
      message: err.message,
      code: err.code,
    });
  }

  // Default server error
  return res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
  });
};

export const createError = (message: string, statusCode: number = 500, code?: string): ApiError => {
  const error = new Error(message) as ApiError;
  error.statusCode = statusCode;
  error.code = code;
  return error;
};