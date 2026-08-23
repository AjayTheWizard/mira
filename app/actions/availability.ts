"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { availability, staff } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

async function managerId() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");
  return session.user.id;
}

export type DayAvailability = {
  dayOfWeek: number; // 0 = Sunday ... 6 = Saturday, matches JS Date.getDay()
  isAvailable: boolean;
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
};

const DEFAULT_WEEK: DayAvailability[] = Array.from({ length: 7 }, (_, dayOfWeek) => ({
  dayOfWeek,
  isAvailable: dayOfWeek !== 0, // default: closed Sundays, open the rest
  startTime: "10:00",
  endTime: "19:00",
}));

export async function getAvailabilityForStaff(staffId: string): Promise<DayAvailability[]> {
  const userId = await managerId();

  const rows = await db
    .select()
    .from(availability)
    .where(and(eq(availability.staffId, staffId), eq(availability.userId, userId)));

  return DEFAULT_WEEK.map((defaultDay) => {
    const existing = rows.find((r) => r.dayOfWeek === defaultDay.dayOfWeek);
    if (!existing) return defaultDay;
    return {
      dayOfWeek: existing.dayOfWeek,
      isAvailable: existing.isAvailable,
      startTime: existing.startTime,
      endTime: existing.endTime,
    };
  });
}

export async function setAvailabilityForStaff(
  staffId: string,
  week: DayAvailability[],
) {
  const userId = await managerId();

  const owned = await db
    .select({ id: staff.id })
    .from(staff)
    .where(and(eq(staff.id, staffId), eq(staff.userId, userId)))
    .limit(1);
  if (!owned[0]) throw new Error("Staff member not found");

  for (const day of week) {
    if (day.startTime >= day.endTime) {
      throw new Error(`End time must be after start time (day ${day.dayOfWeek})`);
    }

    const existing = await db
      .select({ id: availability.id })
      .from(availability)
      .where(
        and(
          eq(availability.staffId, staffId),
          eq(availability.userId, userId),
          eq(availability.dayOfWeek, day.dayOfWeek),
        ),
      )
      .limit(1);

    if (existing[0]) {
      await db
        .update(availability)
        .set({
          isAvailable: day.isAvailable,
          startTime: day.startTime,
          endTime: day.endTime,
          updatedAt: new Date(),
        })
        .where(eq(availability.id, existing[0].id));
    } else {
      await db.insert(availability).values({
        id: crypto.randomUUID(),
        userId,
        staffId,
        dayOfWeek: day.dayOfWeek,
        isAvailable: day.isAvailable,
        startTime: day.startTime,
        endTime: day.endTime,
      });
    }
  }

  revalidatePath("/manager");
  return { success: true };
}
