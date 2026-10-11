import { Request, Response, NextFunction } from "express";
import * as authService from "../services/authService";
import { asyncHandler } from "../utils/asyncHandler";

export const register = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await authService.register(req.body);
    res.status(201).json(result);
  }
);

export const login = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await authService.login(req.body);
    res.json(result);
  }
);

export const me = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = await authService.getCurrentUser(req.user!.id);
    res.json({ user });
  }
);