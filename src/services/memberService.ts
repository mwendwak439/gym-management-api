import * as memberRepo from "../repositories/memberRepository";
import * as planRepo from "../repositories/planRepository";
import * as userRepo from "../repositories/authRepository";
import { CreateMemberInput, UpdateMemberInput, MemberQuery } from "../schemas/memberSchemas";
import { NotFoundError, ConflictError, BadRequestError } from "../utils/errors";

// Helper: add days to a date string (YYYY-MM-DD)
function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
}

export const getAllMembers = async (query: MemberQuery) => {
  return memberRepo.findAll(query);
};

export const getMemberById = async (id: number) => {
  const member = await memberRepo.findById(id);
  if (!member) {
    throw new NotFoundError("Member not found");
  }
  return enrichMember(member);
};

export const getMemberByUserId = async (userId: number) => {
  const member = await memberRepo.findByUserId(userId);
  if (!member) {
    throw new NotFoundError("Member profile not found");
  }
  return enrichMember(member);
};

export const createMember = async (data: CreateMemberInput) => {
  // 1. Verify the user exists and has the "member" role
  const user = await userRepo.findById(data.userId);
  if (!user) {
    throw new NotFoundError("User not found");
  }
  if (user.role !== "member") {
    throw new BadRequestError("User must have the 'member' role");
  }

  // 2. Check that this user doesn't already have a member profile
  const exists = await memberRepo.existsByUserId(data.userId);
  if (exists) {
    throw new ConflictError("This user already has a member profile");
  }

  // 3. Verify the plan exists and is active
  const plan = await planRepo.findById(data.planId);
  if (!plan) {
    throw new NotFoundError("Membership plan not found");
  }
  if (!plan.is_active) {
    throw new BadRequestError("Cannot assign an inactive plan");
  }

  // 4. Compute membership end date
  const membershipEnd = addDays(data.membershipStart, plan.duration_days);

  // 5. Create the member
  const memberId = await memberRepo.create({
    ...data,
    membershipEnd,
    joinedDate: new Date().toISOString().split("T")[0]
  });

  return getMemberById(memberId);
};

export const updateMember = async (id: number, data: UpdateMemberInput) => {
  const existing = await memberRepo.findById(id);
  if (!existing) {
    throw new NotFoundError("Member not found");
  }

  let membershipEnd: string | undefined;

  // If plan changed, recompute membership end from the new plan
  if (data.planId !== undefined && data.planId !== existing.plan_id) {
    const plan = await planRepo.findById(data.planId);
    if (!plan) {
      throw new NotFoundError("Membership plan not found");
    }
    if (!plan.is_active) {
      throw new BadRequestError("Cannot assign an inactive plan");
    }
    membershipEnd = addDays(
      existing.membership_start.toISOString().split("T")[0],
      plan.duration_days
    );
  }

  const updated = await memberRepo.update(id, { ...data, membershipEnd });
  if (!updated) {
    throw new BadRequestError("No valid fields to update");
  }

  return getMemberById(id);
};

export const deleteMember = async (id: number) => {
  const member = await memberRepo.findById(id);
  if (!member) {
    throw new NotFoundError("Member not found");
  }
  await memberRepo.remove(id);
};

// Helper: add computed status and days remaining
function enrichMember(member: any) {
  const today = new Date();
  const endDate = new Date(member.membership_end);
  const daysRemaining = Math.ceil(
    (endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  let membershipStatus: "active" | "expired" | "expiring_soon" = "active";
  if (daysRemaining < 0) {
    membershipStatus = "expired";
  } else if (daysRemaining <= 7) {
    membershipStatus = "expiring_soon";
  }

  return {
    ...member,
    membershipStatus,
    daysRemaining
  };
}