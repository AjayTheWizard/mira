"use server";

import { db } from "@/lib/db";
import { staff, salon } from "@/lib/db/schema";
import { getManagerId } from "@/lib/auth/require-manager";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createStaff(input: {
  name: string;
  role?: string;
  email?: string;
  phone?: string;
  branchId?: string;
}) {
  const userId = await getManagerId();

  if (!input.name.trim()) {
    throw new Error("Staff name is required");
  }

  const [managerSalon] = await db
    .select({ id: salon.id })
    .from(salon)
    .where(eq(salon.userId, userId))
    .limit(1);

  if (!managerSalon) {
    throw new Error("Create a salon before adding staff");
  }

  await db.insert(staff).values({
    id: crypto.randomUUID(),
    userId,
    salonId: managerSalon.id,
    branchId: input.branchId || null,
    name: input.name.trim(),
    role: input.role || null,
    email: input.email || null,
    phone: input.phone || null,
  });

  revalidatePath("/manager");
}

export async function updateStaff(
  id: string,
  input: Partial<{
    name: string;
    role: string | null;
    email: string | null;
    phone: string | null;
    branchId: string | null;
  }>,
) {
  const userId = await getManagerId();

  await db
    .update(staff)
    .set({
      ...input,
      updatedAt: new Date(),
    })
    .where(and(eq(staff.id, id), eq(staff.userId, userId)));

  revalidatePath("/manager");
}

export async function toggleStaffActive(id: string, isActive: boolean) {
  const userId = await getManagerId();

  await db
    .update(staff)
    .set({
      isActive,
      updatedAt: new Date(),
    })
    .where(and(eq(staff.id, id), eq(staff.userId, userId)));

  revalidatePath("/manager");
}

export async function deleteStaff(id: string) {
  const userId = await getManagerId();

  await db.delete(staff).where(and(eq(staff.id, id), eq(staff.userId, userId)));

  revalidatePath("/manager");
}
