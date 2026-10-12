import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.query = schema.parse(req.query) as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.issues.map((e) => ({
          field: e.path.join("."),
          message: e.message
        }));
        res.status(400).json({
          error: {
            message: "Invalid query parameters",
            status: 400,
            details: errors
          }
        });
        return;
      }
      next(error);
    }
  };
};