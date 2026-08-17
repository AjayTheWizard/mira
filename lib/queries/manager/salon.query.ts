import { db } from "@/lib/db";
import { branch, salon } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function getManagerSalon(userId: string) {
  const [result] = await db
    .select()
    .from(salon)
    .where(eq(salon.userId, userId))
    .limit(1);

  return result ?? null;
}

export async function getManagerBranches(userId: string) {
  return db.select().from(branch).where(eq(branch.userId, userId));
}
