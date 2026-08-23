"use client";

import {
  AppointmentViewModel,
  ManagerStats,
  ManagerView,
  MonthlyRevenue,
  RevenueRange,
} from "@/lib/db/types";
import { CalendarDaysIcon, PlusIcon } from "lucide-react";

type DashboardProps = {
  appointments: AppointmentViewModel[];
  setView: (view: ManagerView) => void;
  range: RevenueRange;
  setRange: (range: RevenueRange) => void;
  setShowAppointment: (appointment: AppointmentViewModel | null) => void;
  stats?: ManagerStats;
  monthlyRevenue: MonthlyRevenue[];
};

export function Dashboard({
  appointments,
  setView,
  range,
  setRange,
  setShowAppointment,
  stats,
  monthlyRevenue,
}: DashboardProps) {
  const dashboardStats = stats ?? {
    todayAppointments: 0,
    upcomingAppointments: 0,
    completedToday: 0,
    cancelledToday: 0,
    todayRevenue: 0,
    pendingPaymentCount: 0,
    pendingPaymentAmount: 0,
    pendingPaymentPercentage: 0,
    customers: 0,
    staff: 0,
  };

  const formatCurrency = (value: number) =>
    `रू${Number(value || 0).toLocaleString("en-IN")}`;

  return (
    <>
      <div className="manager-command">
        <div>
          <span className="banner-kicker">
            {new Date()
              .toLocaleDateString("en-IN", {
                weekday: "long",
                day: "2-digit",
                month: "long",
                year: "numeric",
              })
              .toUpperCase()}
          </span>

          <h2>Make every visit feel exceptional.</h2>

          <p>
            All your salons, teams, appointments and payments in one calm
            workspace.
          </p>
        </div>

        <div className="command-actions">
          <button onClick={() => setView("My Salons")}>
            <PlusIcon size={15} />
            Add salon
          </button>

          <button onClick={() => setView("My Staffs")}>
            <PlusIcon size={15} />
            Add staff
          </button>

          <button onClick={() => setView("Appointments")}>
            <CalendarDaysIcon size={15} />
            View appointments
          </button>
        </div>
      </div>

      <div className="manager-stats eight">
        <Stat
          label="Today's appointments"
          value={dashboardStats.todayAppointments}
          note="Scheduled today"
        />

        <Stat
          label="Upcoming"
          value={dashboardStats.upcomingAppointments}
          note="Future appointments"
        />

        <Stat
          label="Completed today"
          value={dashboardStats.completedToday}
          note="Completed today"
        />

        <Stat
          label="Cancelled"
          value={dashboardStats.cancelledToday}
          note="Cancelled today"
        />

        <Stat
          label="Today's revenue"
          value={formatCurrency(dashboardStats.todayRevenue)}
          note="Revenue collected"
        />

        <Stat
          label="Pending payments"
          value={dashboardStats.pendingPaymentCount}
          note={`${formatCurrency(
            dashboardStats.pendingPaymentAmount,
          )} to collect`}
        />

        <Stat
          label="Total customers"
          value={dashboardStats.customers}
          note="Registered customers"
        />

        <Stat
          label="Total staff"
          value={dashboardStats.staff}
          note="Active staff"
        />
      </div>

      <div className="manager-dashboard-grid">
        <section className="profile-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">TODAY&apos;S APPOINTMENTS</p>
              <h2>Keep the day moving</h2>
            </div>

            <button
              className="text-button"
              onClick={() => setView("Appointments")}
            >
              View all
            </button>
          </div>

          <div className="appointment-table">
            <div className="table-head">
              <span>Customer</span>
              <span>Salon / service</span>
              <span>Staff</span>
              <span>Time</span>
              <span>Status</span>
            </div>

            {appointments.length === 0 ? (
              <div className="empty-state">
                No appointments found for today.
              </div>
            ) : (
              appointments.map((a: any) => (
                <button
                  className="table-row table-row-button"
                  key={a.id ?? `${a.customer}-${a.time}`}
                  onClick={() => setShowAppointment(a)}
                >
                  <strong>{a.customer}</strong>

                  <span>
                    {a.salon}
                    <small>{a.service}</small>
                  </span>

                  <span>{a.staff}</span>

                  <span>{a.time}</span>

                  <span className="status-badge">{a.status}</span>
                </button>
              ))
            )}
          </div>
        </section>

        <section className="profile-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">REVENUE OVERVIEW</p>

              <h2>
                {formatCurrency(
                  monthlyRevenue.reduce(
                    (total: number, item: any) =>
                      total + Number(item.revenue || 0),
                    0,
                  ),
                )}
              </h2>
            </div>

            <select
              value={range}
              onChange={(e) => setRange(e.target.value as RevenueRange)}
            >
              <option value="7d">7 days</option>
              <option value="30d">30 days</option>
              <option value="12m">12 months</option>
            </select>
          </div>

          <div className="fake-chart">
            <div className="chart-bars">
              {monthlyRevenue.length === 0 ? (
                <div className="empty-state">No revenue data available.</div>
              ) : (
                monthlyRevenue.map((item: any, index: number) => {
                  const maxRevenue = Math.max(
                    ...monthlyRevenue.map((x: any) => Number(x.revenue || 0)),
                    1,
                  );

                  const height = (Number(item.revenue || 0) / maxRevenue) * 100;

                  return (
                    <span
                      key={item.date ?? index}
                      style={{
                        height: `${Math.max(height, 4)}%`,
                      }}
                      title={`${item.date}: ${formatCurrency(item.revenue)}`}
                    />
                  );
                })
              )}
            </div>

            <div className="chart-labels">
              {monthlyRevenue.slice(0, 4).map((item: any) => (
                <span key={item.date}>
                  {new Date(item.date).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                  })}
                </span>
              ))}
            </div>
          </div>
        </section>
      </div>

      <section className="profile-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">PENDING PAYMENTS</p>
            <h2>Needs your attention</h2>
          </div>

          <button className="text-button" onClick={() => setView("Payments")}>
            Manage payments
          </button>
        </div>

        <div className="payment-summary">
          <div>
            <strong>
              {formatCurrency(dashboardStats.pendingPaymentAmount)}
            </strong>

            <span>
              remaining across {dashboardStats.pendingPaymentCount} appointments
            </span>
          </div>

          <div className="payment-progress">
            <span
              style={{ width: `${dashboardStats.pendingPaymentPercentage}%` }}
            />
          </div>

          <small>Pending payments requiring collection</small>
        </div>
      </section>
    </>
  );
}

type StatProps = {
  label: string;
  value: string | number;
  note: string;
};

function Stat({ label, value, note }: StatProps) {
  return (
    <div className="manager-stat">
      <span className="stat-label">{label}</span>
      <strong className="stat-value">{value}</strong>
      <small className="stat-note">{note}</small>
    </div>
  );
}
