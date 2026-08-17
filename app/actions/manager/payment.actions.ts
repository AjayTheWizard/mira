"use server";

import { db } from "@/lib/db";
import { payment } from "@/lib/db/schema";
import { getManagerId } from "@/lib/auth/require-manager";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type PaymentStatus =
  | "pending"
  | "partial"
  | "paid"
  | "refunded"
  | "cancelled";

const PAYMENT_STATUSES = new Set<PaymentStatus>([
  "pending",
  "partial",
  "paid",
  "refunded",
  "cancelled",
]);

export async function updatePaymentStatus(id: string, status: PaymentStatus) {
  const userId = await getManagerId();

  if (!PAYMENT_STATUSES.has(status)) {
    throw new Error("Invalid payment status");
  }

  await db
    .update(payment)
    .set({
      status,
      updatedAt: new Date(),
    })
    .where(and(eq(payment.id, id), eq(payment.userId, userId)));

  revalidatePath("/manager");
}
