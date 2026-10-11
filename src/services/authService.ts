import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { config } from "../config";
import * as authRepo from "../repositories/authRepository";
import { RegisterInput, LoginInput } from "../schemas/authSchemas";
import { ConflictError, UnauthorizedError } from "../utils/errors";

export const register = async (data: RegisterInput) => {
  // Check if email already exists
  const existing = await authRepo.findByEmail(data.email);
  if (existing) {
    throw new ConflictError("Email already registered");
  }

  // Hash the password
  const passwordHash = await bcrypt.hash(data.password, config.bcrypt.saltRounds);

  // Create the user
  const user = await authRepo.createUser({
    name: data.name,
    email: data.email,
    password: data.password,
    passwordHash
  });

  // Generate JWT
  const token = generateToken(user);

  return { user, token };
};

export const login = async (data: LoginInput) => {
  const user = await authRepo.findByEmail(data.email);

  // Same message for both "user not found" and "wrong password"
  if (!user) {
    throw new UnauthorizedError("Invalid credentials");
  }

  if (!user.is_active) {
    throw new UnauthorizedError("Account is deactivated");
  }

  const isMatch = await bcrypt.compare(data.password, user.password);
  if (!isMatch) {
    throw new UnauthorizedError("Invalid credentials");
  }

  // Remove password before returning
  const { password, ...safeUser } = user;

  const token = generateToken(safeUser);

  return { user: safeUser, token };
};

export const getCurrentUser = async (userId: number) => {
  const user = await authRepo.findById(userId);
  if (!user) {
    throw new UnauthorizedError("User not found");
  }
  return user;
};

function generateToken(user: { id: number; email: string; role: string }) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn as any }
  );
}