import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import HomeClient from "./home-client";
import {
  getExploreSalons,
  getFavoriteSalonIds,
  getMyAppointments,
  getMyNotifications,
  getPreferences,
  getUnreadNotificationCount,
} from "@/app/actions/customer";

export default async function Page() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/sign-in");

  const role = (
    (session.user as { role?: string }).role === "manager"
      ? "manager"
      : "customer"
  ) as "customer" | "manager";

  if (role === "manager") {
    redirect("/manager");
  }

  const [salons, favoriteIds, appointments, preferences, unreadCount, notifications] =
    await Promise.all([
      getExploreSalons(),
      getFavoriteSalonIds(),
      getMyAppointments(),
      getPreferences(),
      getUnreadNotificationCount(),
      getMyNotifications(),
    ]);

  return (
    <HomeClient
      user={{ name: session.user.name, email: session.user.email, role }}
      initialSalons={salons}
      initialFavoriteIds={favoriteIds}
      initialAppointments={appointments}
      initialPreferences={preferences}
      initialUnreadCount={unreadCount}
      initialNotifications={notifications}
    />
  );
}
