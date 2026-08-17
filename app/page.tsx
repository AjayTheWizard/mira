import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import HomeClient from "./home-client";

export default async function Page() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/sign-in");

  console.log(session.user)
  const role = (
    (session.user as { role?: string }).role === "manager"
      ? "manager"
      : "customer"
  ) as "customer" | "manager";
  if (role === "manager") {
    redirect("/manager");
  }
  return (
    <HomeClient
      user={{ name: session.user.name, email: session.user.email, role }}
    />
  );
}
