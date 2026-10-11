import { pool } from "../db";
import { RegisterInput } from "../schemas/authSchemas";

export interface UserRow {
  id: number;
  name: string;
  email: string;
  password: string;
  role: "admin" | "staff" | "member";
  is_active: boolean;
  created_at: Date;
}

export const findByEmail = async (email: string): Promise<UserRow | null> => {
  const [rows] = await pool.execute(
    "SELECT id, name, email, password, role, is_active, created_at FROM users WHERE email = ?",
    [email]
  );
  const users = rows as UserRow[];
  return users[0] || null;
};

export const findById = async (id: number): Promise<Omit<UserRow, "password"> | null> => {
  const [rows] = await pool.execute(
    "SELECT id, name, email, role, is_active, created_at FROM users WHERE id = ?",
    [id]
  );
  const users = rows as Omit<UserRow, "password">[];
  return users[0] || null;
};

export const createUser = async (
  data: RegisterInput & { passwordHash: string }
): Promise<Omit<UserRow, "password">> => {
  const [result]: any = await pool.execute(
    "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
    [data.name, data.email, data.passwordHash, "member"]
  );

  return {
    id: result.insertId,
    name: data.name,
    email: data.email,
    role: "member",
    is_active: true,
    created_at: new Date()
  };
};