import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function requireManager() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  if (session.user.role !== "manager") {
    throw new Error("Forbidden");
  }

  return session.user;
}

export async function getManagerId() {
  const user = await requireManager();

  return user.id;
}
