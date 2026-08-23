"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, PlusIcon, SearchIcon } from "lucide-react";
import { AppointmentViewModel } from "@/lib/db/types";
import {
  createManagerAppointment,
  getBranches,
  getStaff,
} from "@/app/actions/manager";
import { getServices } from "@/app/actions/service";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type AppointmentViewProps = {
  appointments: AppointmentViewModel[];
  search: string;
  setSearch: (value: string) => void;
  status: string;
  setStatus: (value: string) => void;
  setShowAppointment: (appointment: AppointmentViewModel | null) => void;
};

type BranchOption = { id: string; name: string; city: string | null };
type StaffOption = { id: string; name: string };
type ServiceOption = {
  id: string;
  name: string;
  durationMinutes: number;
  price: number;
};

const emptyForm = {
  customerName: "",
  branchId: "",
  serviceId: "",
  staffId: "",
  appointmentDate: "",
  appointmentTime: "",
};

export function AppointmentView({
  appointments,
  search,
  setSearch,
  status,
  setStatus,
  setShowAppointment,
}: AppointmentViewProps) {
  const [salonFilter, setSalonFilter] = useState("All");

  const salonOptions = useMemo(
    () => Array.from(new Set(appointments.map((a) => a.salon))).sort(),
    [appointments],
  );

  const visibleAppointments = appointments.filter(
    (a) =>
      (status === "All" || a.status === status) &&
      (salonFilter === "All" || a.salon === salonFilter),
  );

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
        <Select value={salonFilter} onValueChange={setSalonFilter}>
          <SelectTrigger className="w-45">
            <SelectValue placeholder="All salons" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="All">All salons</SelectItem>

            {salonOptions.map((salon) => (
              <SelectItem key={salon} value={salon}>
                {salon}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="All">All</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Confirmed">Confirmed</SelectItem>
            <SelectItem value="Upcoming">Upcoming</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
            <SelectItem value="Cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
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
          {visibleAppointments.length === 0 ? (
            <div className="empty-state">No appointments found.</div>
          ) : (
            visibleAppointments.map((a) => (
              <button
                className="table-row table-row-button"
                key={a.id}
                onClick={() => setShowAppointment(a)}
              >
                <strong>{a.customer}</strong>
                <span>
                  {a.salon}
                  <small>{a.service}</small>
                </span>
                <span>{a.staff}</span>
                <span>
                  {a.date.toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                  })}{" "}
                  · {a.time}
                </span>
                <span>{a.amount}</span>
                <span className="status-badge">{a.status}</span>
              </button>
            ))
          )}
        </div>
      </section>
    </>
  );
}
