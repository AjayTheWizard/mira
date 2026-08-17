import { db } from "@/lib/db";
import { staff } from "@/lib/db/schema";
import { and, count, eq } from "drizzle-orm";

export async function getManagerStaff(userId: string) {
  return db.select().from(staff).where(eq(staff.userId, userId));
}

export async function getActiveStaffCount(userId: string) {
  const [result] = await db
    .select({
      count: count(),
    })
    .from(staff)
    .where(and(eq(staff.userId, userId), eq(staff.isActive, true)));

  return result?.count ?? 0;
}
