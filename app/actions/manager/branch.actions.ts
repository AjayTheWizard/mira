"use server";

import { db } from "@/lib/db";
import { branch, salon } from "@/lib/db/schema";
import { getManagerId } from "@/lib/auth/require-manager";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createBranch(input: {
  name: string;
  address?: string;
  city?: string;
  phone?: string;
  latitude?: string;
  longitude?: string;
  placeId?: string;
}) {
  const userId = await getManagerId();

  const [managerSalon] = await db
    .select({ id: salon.id })
    .from(salon)
    .where(eq(salon.userId, userId))
    .limit(1);

  if (!managerSalon) {
    throw new Error("Create your salon first");
  }

  await db.insert(branch).values({
    id: crypto.randomUUID(),
    userId,
    salonId: managerSalon.id,
    name: input.name,
    address: input.address ?? null,
    city: input.city ?? null,
    phone: input.phone ?? null,
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
    placeId: input.placeId ?? null,
  });

  revalidatePath("/manager");
}
