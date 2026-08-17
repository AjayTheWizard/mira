"use server";

import { db } from "@/lib/db";
import { salon } from "@/lib/db/schema";
import { getManagerId } from "@/lib/auth/require-manager";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

type SalonInput = {
  name: string;
  description?: string;
  phone?: string;
  email?: string;
  logoUrl?: string;
};

export async function updateSalon(input: SalonInput) {
  const userId = await getManagerId();

  const [existingSalon] = await db
    .select({ id: salon.id })
    .from(salon)
    .where(eq(salon.userId, userId))
    .limit(1);

  if (existingSalon) {
    await db
      .update(salon)
      .set({
        name: input.name,
        description: input.description ?? null,
        phone: input.phone ?? null,
        email: input.email ?? null,
        logoUrl: input.logoUrl ?? null,
        updatedAt: new Date(),
      })
      .where(eq(salon.id, existingSalon.id));
  } else {
    await db.insert(salon).values({
      id: crypto.randomUUID(),
      userId,
      name: input.name,
      description: input.description ?? null,
      phone: input.phone ?? null,
      email: input.email ?? null,
      logoUrl: input.logoUrl ?? null,
    });
  }

  revalidatePath("/manager");
}
