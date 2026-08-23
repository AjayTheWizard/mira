"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { salon, service } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

async function managerId() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");
  return session.user.id;
}

export async function getServices() {
  const userId = await managerId();
  return db
    .select()
    .from(service)
    .where(eq(service.userId, userId))
    .orderBy(service.name);
}

export async function createService(input: {
  name: string;
  category?: string;
  description?: string;
  durationMinutes: number;
  price: number;
}) {
  const userId = await managerId();

  if (!input.name?.trim()) throw new Error("Service name is required");
  if (input.durationMinutes <= 0) throw new Error("Duration must be greater than 0");
  if (input.price < 0) throw new Error("Price cannot be negative");

  const existingSalon = await db
    .select()
    .from(salon)
    .where(eq(salon.userId, userId))
    .limit(1);

  if (!existingSalon[0]) {
    throw new Error("Create a salon before adding services");
  }

  const salonId = existingSalon[0].id;
  const name = input.name.trim();

  const duplicate = await db
    .select({ id: service.id })
    .from(service)
    .where(and(eq(service.salonId, salonId), eq(service.name, name)))
    .limit(1);

  if (duplicate.length > 0) {
    throw new Error("A service with this name already exists");
  }

  await db.insert(service).values({
    id: crypto.randomUUID(),
    userId,
    salonId,
    name,
    category: input.category?.trim() || null,
    description: input.description?.trim() || null,
    durationMinutes: input.durationMinutes,
    price: input.price,
  });

  revalidatePath("/manager");
  return { success: true };
}

export async function updateService(
  id: string,
  input: Partial<{
    name: string;
    category: string;
    description: string;
    durationMinutes: number;
    price: number;
  }>,
) {
  const userId = await managerId();
  await db
    .update(service)
    .set({ ...input, updatedAt: new Date() })
    .where(and(eq(service.id, id), eq(service.userId, userId)));
  revalidatePath("/manager");
}

export async function toggleServiceActive(id: string, isActive: boolean) {
  const userId = await managerId();
  await db
    .update(service)
    .set({ isActive, updatedAt: new Date() })
    .where(and(eq(service.id, id), eq(service.userId, userId)));
  revalidatePath("/manager");
}

export async function deleteService(id: string) {
  const userId = await managerId();
  await db.delete(service).where(and(eq(service.id, id), eq(service.userId, userId)));
  revalidatePath("/manager");
}
