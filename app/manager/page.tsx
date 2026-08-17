import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { getManagerDashboard } from "@/app/actions/manager";

import ManagerWorkspace from "./workspace";

export default async function ManagerPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/sign-up");
  }

  if (session.user.role !== "manager") {
    redirect("/");
  }

  const data = await getManagerDashboard(session.user.id);

  return (
    <ManagerWorkspace
      initialSalon={data.salon}
      initialBranches={data.branches}
      initialPayments={data.payments}
      ratings={data.ratings}
      initialAppointments={data.appointments}
      initialStaff={data.staffs}
      stats={data.stats}
      monthlyRevenue={data.monthlyRevenue}
      user={data.manager ?? undefined}
    />
  );
}
