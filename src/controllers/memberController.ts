import { Request, Response } from "express";
import * as memberService from "../services/memberService";
import { asyncHandler } from "../utils/asyncHandler";
import { ForbiddenError } from "../utils/errors";

export const getAll = asyncHandler(async (req: Request, res: Response) => {
  const result = await memberService.getAllMembers(req.query as any);
  res.json(result);
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string, 10);
  const member = await memberService.getMemberById(id);
  res.json(member);
});

export const getMyProfile = asyncHandler(async (req: Request, res: Response) => {
  const member = await memberService.getMemberByUserId(req.user!.id);
  res.json(member);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const member = await memberService.createMember(req.body);
  res.status(201).json(member);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string, 10);
  const member = await memberService.updateMember(id, req.body);
  res.json(member);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
const id = parseInt(req.params.id as string, 10);
  await memberService.deleteMember(id);
  res.status(204).send();
});