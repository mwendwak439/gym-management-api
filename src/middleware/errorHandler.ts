import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors";
import { config } from "../config";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log the error
  console.error(`[ERROR] ${req.method} ${req.url}:`, err.message);

  // Default values
  let statusCode = 500;
  let message = "Internal Server Error";

  // If it's our custom error, use its values
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  }

  // Handle MySQL duplicate entry
  if ((err as any).code === "ER_DUP_ENTRY") {
    statusCode = 409;
    message = "Resource already exists";
  }

  // Response body
  const body: any = {
    error: {
      message,
      status: statusCode
    }
  };

  // Include stack trace only in development
  if (config.env === "development") {
    body.error.stack = err.stack;
  }

  res.status(statusCode).json(body);
};

// 404 handler for unknown routes
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    error: {
      message: `Route ${req.method} ${req.url} not found`,
      status: 404
    }
  });
};