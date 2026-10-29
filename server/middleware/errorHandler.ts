import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';

export interface ApiErrorResponse {
  success: false;
  error: string;
  details?: Record<string, string> | unknown;
  stack?: string;
}

export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // If headers already sent, delegate to default Express handler
  if (res.headersSent) {
    return next(err);
  }

  // 1. Mongoose Validation Error
  if (err.name === 'ValidationError' && err.errors) {
    const details: Record<string, string> = {};
    for (const key in err.errors) {
      details[key] = err.errors[key].message;
    }
    res.status(400).json({
      success: false,
      error: 'Validation failed. Please check the submitted fields.',
      details,
    });
    return;
  }

  // 2. Mongoose Invalid ObjectId (CastError)
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    res.status(400).json({
      success: false,
      error: `Invalid resource identifier format: "${err.value}"`,
    });
    return;
  }

  // 3. Custom AppError
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
    return;
  }

  // 4. Duplicate Key Error
  if (err.code === 11000) {
    res.status(409).json({
      success: false,
      error: 'Duplicate record conflict.',
      details: err.keyValue,
    });
    return;
  }

  // 5. Fallback Internal Server Error
  console.error('[ServerError]', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error. Please try again later.',
  });
}

