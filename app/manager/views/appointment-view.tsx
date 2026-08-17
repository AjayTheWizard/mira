"use client";

import { AppointmentViewModel } from "@/lib/db/types";
import { PlusIcon, SearchIcon } from "lucide-react";

type AppointmentViewProps = {
  appointments: AppointmentViewModel[];
  search: string;
  setSearch: (value: string) => void;
  status: string;
  setStatus: (value: string) => void;
  setShowAppointment: (appointment: AppointmentViewModel | null) => void;
};

export function AppointmentView({
  appointments,
  search,
  setSearch,
  status,
  setStatus,
  setShowAppointment,
}: AppointmentViewProps) {
  return (
    <>
      <div className="manager-view-toolbar">
        <div>
          <p className="eyebrow">OPERATIONS</p>
          <h2>All appointments</h2>
          <p className="muted">
            Manage every booking across your salon branches.
          </p>
        </div>
        <button className="btn btn-primary">
          <PlusIcon size={15} /> Create appointment
        </button>
      </div>
      <div className="manager-filters">
        <div className="filter-search">
          <SearchIcon size={15} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customer, phone or ID..."
          />
        </div>
        <select>
          <option>All salons</option>
          <option>Indiranagar</option>
          <option>Koramangala</option>
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option>All</option>
          <option>Pending</option>
          <option>Confirmed</option>
          <option>Completed</option>
          <option>Cancelled</option>
        </select>
        <button className="btn btn-secondary">Calendar view</button>
      </div>
      <section className="profile-panel">
        <div className="appointment-table full">
          <div className="table-head">
            <span>Customer</span>
            <span>Salon / service</span>
            <span>Staff</span>
            <span>Date & time</span>
            <span>Amount</span>
            <span>Status</span>
          </div>
          {appointments
            .filter((a: any) => status === "All" || a.status === status)
            .map((a: any) => (
              <button
                className="table-row table-row-button"
                key={a.customer}
                onClick={() => setShowAppointment(a)}
              >
                <strong>{a.customer}</strong>
                <span>
                  {a.salon}
                  <small>{a.service}</small>
                </span>
                <span>{a.staff}</span>
                <span>21 May · {a.time}</span>
                <span>{a.amount}</span>
                <span className="status-badge">{a.status}</span>
              </button>
            ))}
        </div>
      </section>
    </>
  );
}
