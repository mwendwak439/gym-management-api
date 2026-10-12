import { pool } from "../db";
import { CreateMemberInput, UpdateMemberInput, MemberQuery } from "../schemas/memberSchemas";

export interface MemberRow {
  id: number;
  user_id: number;
  plan_id: number | null;
  phone: string | null;
  date_of_birth: Date | null;
  emergency_contact: string | null;
  joined_date: Date;
  membership_start: Date;
  membership_end: Date;
  is_active: boolean;
  created_at: Date;
}

export interface MemberWithDetails extends MemberRow {
  user_name: string;
  user_email: string;
  plan_name: string | null;
  plan_price: number | null;
}

export const findAll = async (query: MemberQuery) => {
  const { page, limit, search, status, planId, sortBy, sortOrder } = query;
  const offset = (page - 1) * limit;

  // Build WHERE clauses dynamically
  const conditions: string[] = [];
  const params: any[] = [];

  if (search) {
    conditions.push("(u.name LIKE ? OR u.email LIKE ? OR m.phone LIKE ?)");
    const like = `%${search}%`;
    params.push(like, like, like);
  }

  if (status === "active") {
    conditions.push("m.membership_end >= CURDATE() AND m.is_active = TRUE");
  } else if (status === "expired") {
    conditions.push("(m.membership_end < CURDATE() OR m.is_active = FALSE)");
  }

  if (planId) {
    conditions.push("m.plan_id = ?");
    params.push(planId);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  // Whitelist sort columns to prevent SQL injection
  const allowedSortColumns: Record<string, string> = {
    name: "u.name",
    joined_date: "m.joined_date",
    membership_end: "m.membership_end"
  };
  const orderColumn = allowedSortColumns[sortBy] || "m.joined_date";
  const orderDirection = sortOrder === "asc" ? "ASC" : "DESC";

  // Count query
  const countSql = `
    SELECT COUNT(*) as total
    FROM members m
    JOIN users u ON u.id = m.user_id
    ${whereClause}
  `;
  const [countRows]: any = await pool.execute(countSql, params);
  const total = countRows[0].total;

  // Data query
  const dataSql = `
    SELECT
      m.*,
      u.name AS user_name,
      u.email AS user_email,
      p.name AS plan_name,
      p.price AS plan_price
    FROM members m
    JOIN users u ON u.id = m.user_id
    LEFT JOIN membership_plans p ON p.id = m.plan_id
    ${whereClause}
    ORDER BY ${orderColumn} ${orderDirection}
    LIMIT ? OFFSET ?
  `;
  const [rows] = await pool.execute(dataSql, [...params, limit, offset]);

  return {
    data: rows as MemberWithDetails[],
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
};

export const findById = async (id: number): Promise<MemberWithDetails | null> => {
  const [rows] = await pool.execute(
    `SELECT
      m.*,
      u.name AS user_name,
      u.email AS user_email,
      p.name AS plan_name,
      p.price AS plan_price
    FROM members m
    JOIN users u ON u.id = m.user_id
    LEFT JOIN membership_plans p ON p.id = m.plan_id
    WHERE m.id = ?`,
    [id]
  );
  const members = rows as MemberWithDetails[];
  return members[0] || null;
};

export const findByUserId = async (userId: number): Promise<MemberWithDetails | null> => {
  const [rows] = await pool.execute(
    `SELECT
      m.*,
      u.name AS user_name,
      u.email AS user_email,
      p.name AS plan_name,
      p.price AS plan_price
    FROM members m
    JOIN users u ON u.id = m.user_id
    LEFT JOIN membership_plans p ON p.id = m.plan_id
    WHERE m.user_id = ?`,
    [userId]
  );
  const members = rows as MemberWithDetails[];
  return members[0] || null;
};

export const create = async (
  data: CreateMemberInput & { membershipEnd: string; joinedDate: string }
): Promise<number> => {
  const [result]: any = await pool.execute(
    `INSERT INTO members
      (user_id, plan_id, phone, date_of_birth, emergency_contact, joined_date, membership_start, membership_end)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.userId,
      data.planId,
      data.phone || null,
      data.dateOfBirth || null,
      data.emergencyContact || null,
      data.joinedDate,
      data.membershipStart,
      data.membershipEnd
    ]
  );
  return result.insertId;
};

export const update = async (
  id: number,
  data: UpdateMemberInput & { membershipEnd?: string }
): Promise<boolean> => {
  const fields: string[] = [];
  const params: any[] = [];

  if (data.planId !== undefined) {
    fields.push("plan_id = ?");
    params.push(data.planId);
  }
  if (data.phone !== undefined) {
    fields.push("phone = ?");
    params.push(data.phone);
  }
  if (data.emergencyContact !== undefined) {
    fields.push("emergency_contact = ?");
    params.push(data.emergencyContact);
  }
  if (data.isActive !== undefined) {
    fields.push("is_active = ?");
    params.push(data.isActive);
  }
  if (data.membershipEnd !== undefined) {
    fields.push("membership_end = ?");
    params.push(data.membershipEnd);
  }

  if (fields.length === 0) return false;

  params.push(id);
  const [result]: any = await pool.execute(
    `UPDATE members SET ${fields.join(", ")} WHERE id = ?`,
    params
  );

  return result.affectedRows > 0;
};

export const remove = async (id: number): Promise<boolean> => {
  const [result]: any = await pool.execute("DELETE FROM members WHERE id = ?", [id]);
  return result.affectedRows > 0;
};

export const existsByUserId = async (userId: number): Promise<boolean> => {
  const [rows]: any = await pool.execute(
    "SELECT id FROM members WHERE user_id = ?",
    [userId]
  );
  return rows.length > 0;
};