import { db } from "@/lib/db";
import { rating } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function getManagerRatings(userId: string) {
  return db.select().from(rating).where(eq(rating.userId, userId));
}
