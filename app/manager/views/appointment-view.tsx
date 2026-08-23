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
  const router = useRouter();
  const [salonFilter, setSalonFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [staffOptions, setStaffOptions] = useState<StaffOption[]>([]);
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!showForm) return;
    Promise.all([getBranches(), getStaff(), getServices()]).then(
      ([branchRows, staffRows, serviceRows]) => {
        setBranches(branchRows as BranchOption[]);
        setStaffOptions(staffRows as StaffOption[]);
        setServices(serviceRows as ServiceOption[]);
      },
    );
  }, [showForm]);

  const salonOptions = useMemo(
    () => Array.from(new Set(appointments.map((a) => a.salon))).sort(),
    [appointments],
  );

  const visibleAppointments = appointments.filter(
    (a) =>
      (status === "All" || a.status === status) &&
      (salonFilter === "All" || a.salon === salonFilter),
  );

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!form.serviceId) {
      setError("Select a service");
      return;
    }

    setSaving(true);
    try {
      await createManagerAppointment(form);
      setForm(emptyForm);
      setShowForm(false);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create appointment",
      );
    } finally {
      setSaving(false);
    }
  }

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
        <button
          className="btn btn-primary"
          onClick={() => setShowForm((v) => !v)}
        >
          <PlusIcon size={15} /> {showForm ? "Cancel" : "Create appointment"}
        </button>
      </div>

      {showForm && (
        <form
          className="branch-form profile-panel"
          onSubmit={handleCreate}
        >
          <input
            value={form.customerName}
            onChange={(e) =>
              setForm({ ...form, customerName: e.target.value })
            }
            placeholder="Customer name"
            required
          />

          <select
            value={form.branchId}
            onChange={(e) => setForm({ ...form, branchId: e.target.value })}
          >
            <option value="">Any branch</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} {b.city ? `· ${b.city}` : ""}
              </option>
            ))}
          </select>

          <select
            value={form.serviceId}
            onChange={(e) => setForm({ ...form, serviceId: e.target.value })}
            required
          >
            <option value="" disabled>
              Select service
            </option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} · {s.durationMinutes} min · रू{s.price}
              </option>
            ))}
          </select>

          <select
            value={form.staffId}
            onChange={(e) => setForm({ ...form, staffId: e.target.value })}
          >
            <option value="">Unassigned</option>
            {staffOptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={form.appointmentDate}
            onChange={(e) =>
              setForm({ ...form, appointmentDate: e.target.value })
            }
            required
          />

          <input
            type="time"
            value={form.appointmentTime}
            onChange={(e) =>
              setForm({ ...form, appointmentTime: e.target.value })
            }
            required
          />

          {error && <div className="error-banner">{error}</div>}

          <button className="btn btn-secondary" disabled={saving}>
            {saving ? (
              <Loader2 size={14} className="spin" />
            ) : (
              <PlusIcon size={14} />
            )}
            Save appointment
          </button>
        </form>
      )}

      <div className="manager-filters">
        <div className="filter-search">
          <SearchIcon size={15} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customer, phone or ID..."
          />
        </div>
        <select
          value={salonFilter}
          onChange={(e) => setSalonFilter(e.target.value)}
        >
          <option value="All">All salons</option>
          {salonOptions.map((salon) => (
            <option key={salon} value={salon}>
              {salon}
            </option>
          ))}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option>All</option>
          <option>Pending</option>
          <option>Confirmed</option>
          <option>Arrived</option>
          <option>Completed</option>
          <option>Cancelled</option>
        </select>
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
