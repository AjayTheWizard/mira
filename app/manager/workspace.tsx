"use client";
import {
  updateAppointmentStatus,
  updatePaymentMethod,
  updatePaymentStatus,
} from "@/app/actions/manager";
import {
  Bell,
  CalendarDays,
  Clock,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  Scissors,
  Search,
  Settings,
  Store,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ProfileView } from "@/app/manager/views/profile-view";
import { ServiceView } from "@/app/manager/views/service-view";
import { AvailabilityView } from "@/app/manager/views/availability-view";
import type {
  AppointmentViewModel,
  Branch,
  ManagerAppointment,
  ManagerStats,
  ManagerView,
  MonthlyRevenue,
  Payment,
  Rating,
  RevenueRange,
  Salon,
  Staff,
  User,
} from "@/lib/db/types";
import { AppointmentDrawer } from "./appointment-drawer";
import { Dashboard } from "./dashboard";
import { AppointmentView } from "./views/appointment-view";
import { PaymentView } from "./views/payment-view";
import { SalonView } from "./views/salon-view";
import { StaffView } from "./views/staff-view";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
type Props = {
  initialSalon: Salon | null;
  initialBranches: Branch[];
  initialPayments: Payment[];
  ratings: Rating[];
  initialAppointments?: ManagerAppointment[];
  initialStaff?: Staff[];
  stats?: ManagerStats;
  monthlyRevenue?: MonthlyRevenue[];
  user?: User;
};
export default function ManagerWorkspace({
  initialSalon,
  initialBranches,
  initialPayments,
  ratings,
  initialAppointments = [],
  initialStaff = [],
  stats,
  monthlyRevenue = [],
  user,
}: Props) {
   const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>(initialPayments);
  const [appointments, setAppointments] =
    useState<ManagerAppointment[]>(initialAppointments);
  const [mobileNav, setMobileNav] = useState(false);
  const [view, setView] = useState<ManagerView>("Home");
  const [range, setRange] = useState<RevenueRange>("7d");
  const [search, setSearch] = useState("");
  const [appointmentStatus, setAppointmentStatus] = useState("All");
  // Local state only initializes from props once; router.refresh() (used
  // after creating/updating records) re-fetches server data and passes new
  // props, so re-sync local state when that happens.
  useEffect(() => {
    setAppointments(initialAppointments);
  }, [initialAppointments]);
  useEffect(() => {
    setPayments(initialPayments);
  }, [initialPayments]);
  const [showAppointment, setShowAppointment] =
    useState<AppointmentViewModel | null>(null);
  const managerName = user?.name || "Arjun Kapoor";
  const initials = managerName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  async function changePayment(id: string, status: string) {
    await updatePaymentStatus(id, status);
    setPayments(payments.map((p) => (p.id === id ? { ...p, status } : p)));
  }
  async function changePaymentMethod(id: string, method: string) {
    await updatePaymentMethod(id, method);
    setPayments(payments.map((p) => (p.id === id ? { ...p, method } : p)));
  }
  async function changeAppointmentStatus(id: string, status: string) {
    await updateAppointmentStatus(id, status);
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status } : a)),
    );
    setShowAppointment((prev: AppointmentViewModel | null) =>
      prev && prev.id === id
        ? {
            ...prev,
            status: status.replace(/^./, (c) => c.toUpperCase()),
          }
        : prev,
    );
  }
  const dynamicAppointments: AppointmentViewModel[] = appointments.map(
    (appointment) => ({
      id: appointment.id,
      customer: appointment.customerName,
      salon: appointment.salonName,
      service: appointment.serviceName,
      staff: appointment.staffName ?? "Unassigned",
      time: appointment.appointmentDate.toLocaleTimeString("en-IN", {
        hour: "numeric",
        minute: "2-digit",
      }),
      date: appointment.appointmentDate,
      status: appointment.status.replace(/^./, (character) =>
        character.toUpperCase(),
      ),
      amount: `रू${appointment.amount.toLocaleString("en-IN")}`,
    }),
  );
  const filteredAppointments = useMemo(
    () =>
      dynamicAppointments.filter((appointment) =>
        `${appointment.customer} ${appointment.salon} ${appointment.service} ${appointment.staff}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [dynamicAppointments, search],
  );
  const average = ratings.length
    ? (ratings.reduce((a, r) => a + r.score, 0) / ratings.length).toFixed(1)
    : "0.0";
  const navItems = [
    ["Home", LayoutDashboard],
    ["Appointments", CalendarDays],
    ["My Salons", Store],
    ["My Services", Scissors],
    ["My Staffs", Users],
    ["Availability", Clock],
    ["Payments", CreditCard],
    ["Profile", Settings],
  ] as const;
  async function signOut() {
    await authClient.signOut();
    router.push("/sign-in");
    router.refresh();
  }
  return (
    <div className="manager-portal">
      <aside className={`manager-sidebar ${mobileNav ? "mobile-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark">m</div>
          <span>
            AuraSync<span className="brand-dot">.</span>
          </span>
        </div>
        <p className="nav-label">Manager portal</p>
        <nav>
          {navItems.map(([label, Icon]) => (
            <button
              key={label}
              className={`nav-item ${view === label ? "active" : ""}`}
              onClick={() => {
                setView(label);
                setMobileNav(false);
              }}
            >
              <Icon size={17} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="manager-sidebar-bottom">
          <div className="manager-user">
            <div className="avatar">{initials}</div>
            <div>
              <strong>{managerName}</strong>
              <span>Owner account</span>
            </div>
          </div>
          <button onClick={signOut} className="nav-item">
            <LogOut size={17} />
            <span>Log out</span>
          </button>
        </div>
      </aside>
      <main className="manager-main">
        <header className="manager-header">
          <button
            className="mobile-menu"
            onClick={() => setMobileNav(!mobileNav)}
          >
            <Menu size={20} />
          </button>
          <div>
            <p className="eyebrow">{view.toUpperCase()}</p>
            <h1>
              {view === "Home"
                ? `Good morning, ${managerName.split(" ")[0]}`
                : view}
            </h1>
          </div>
          <div className="manager-header-actions">
            <button
              className="icon-button"
              aria-label="Search"
              onClick={() => setView("Appointments")}
            >
              <Search size={17} />
            </button>
            <button className="icon-button" aria-label="Notifications">
              <Bell size={17} />
            </button>
            <div className="avatar">{initials}</div>
          </div>
        </header>
        <div className="manager-content">
          {view === "Home" && (
            <Dashboard
              appointments={filteredAppointments}
              setView={setView}
              range={range}
              setRange={setRange}
              setShowAppointment={setShowAppointment}
              stats={stats}
              monthlyRevenue={monthlyRevenue}
            />
          )}{" "}
          {view === "Appointments" && (
            <AppointmentView
              appointments={filteredAppointments}
              search={search}
              setSearch={setSearch}
              status={appointmentStatus}
              setStatus={setAppointmentStatus}
              setShowAppointment={setShowAppointment}
            />
          )}{" "}
          {view === "My Salons" && <SalonView />}
          {view === "My Services" && <ServiceView />}
          {view === "My Staffs" && <StaffView />}{" "}
          {view === "Availability" && <AvailabilityView />}
          {view === "Payments" && (
            <PaymentView
              payments={payments}
              changePayment={changePayment}
              changeMethod={changePaymentMethod}
              appointments={dynamicAppointments}
              setShowAppointment={setShowAppointment}
            />
          )}
          {view === "Profile" && (
            <ProfileView user={user} average={average} />
          )}{" "}
        </div>
        {showAppointment && (
          <AppointmentDrawer
            appointment={showAppointment}
            onClose={() => setShowAppointment(null)}
            onStatusChange={changeAppointmentStatus}
          />
        )}{" "}
      </main>
    </div>
  );
}
