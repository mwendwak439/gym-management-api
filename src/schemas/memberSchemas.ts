import { z } from "zod";

export const createMemberSchema = z.object({
  userId: z.number().int().positive("User ID must be a positive integer"),
  planId: z.number().int().positive("Plan ID must be a positive integer"),
  phone: z
    .string()
    .regex(/^\+?[0-9]{10,15}$/, "Phone must be 10-15 digits, optionally starting with +")
    .optional(),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date of birth must be YYYY-MM-DD")
    .optional(),
  emergencyContact: z.string().max(100).optional(),
  membershipStart: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Membership start must be YYYY-MM-DD")
});

export const updateMemberSchema = z.object({
  planId: z.number().int().positive().optional(),
  phone: z
    .string()
    .regex(/^\+?[0-9]{10,15}$/, "Phone must be 10-15 digits")
    .optional(),
  emergencyContact: z.string().max(100).optional(),
  isActive: z.boolean().optional()
});

export const memberQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  status: z.enum(["active", "expired", "all"]).default("all"),
  planId: z.coerce.number().int().positive().optional(),
  sortBy: z.enum(["name", "joined_date", "membership_end"]).default("joined_date"),
  sortOrder: z.enum(["asc", "desc"]).default("desc")
});

export type CreateMemberInput = z.infer<typeof createMemberSchema>;
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;
export type MemberQuery = z.infer<typeof memberQuerySchema>;