import { db } from "@/lib/db";
import { payment } from "@/lib/db/schema";
import { and, count, eq, sum } from "drizzle-orm";

export async function getManagerPayments(userId: string) {
  return db.select().from(payment).where(eq(payment.userId, userId));
}

export async function getPendingPaymentStats(userId: string) {
  const [result] = await db
    .select({
      count: count(),
      total: sum(payment.amount),
    })
    .from(payment)
    .where(and(eq(payment.userId, userId), eq(payment.status, "pending")));

  return {
    count: result?.count ?? 0,
    total: Number(result?.total ?? 0),
  };
}
