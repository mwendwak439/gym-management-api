import { pool } from "../db";

export interface PlanRow {
  id: number;
  name: string;
  description: string | null;
  duration_days: number;
  price: number;
  is_active: boolean;
  created_at: Date;
}

export const findById = async (id: number): Promise<PlanRow | null> => {
  const [rows] = await pool.execute(
    "SELECT * FROM membership_plans WHERE id = ?",
    [id]
  );
  const plans = rows as PlanRow[];
  return plans[0] || null;
};

export const findAll = async (): Promise<PlanRow[]> => {
  const [rows] = await pool.execute(
    "SELECT * FROM membership_plans WHERE is_active = TRUE ORDER BY price ASC"
  );
  return rows as PlanRow[];
};