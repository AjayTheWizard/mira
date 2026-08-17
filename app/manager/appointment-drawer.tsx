"use client";

import { AppointmentViewModel } from "@/lib/db/types";
import { XIcon } from "lucide-react";

export function AppointmentDrawer({
  appointment,
  onClose,
}: {
  appointment: AppointmentViewModel;
  onClose: () => void;
}) {
  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <aside
        className="appointment-drawer"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="drawer-header">
          <div>
            <p className="eyebrow">APPOINTMENT DETAILS</p>
            <h2>{appointment.customer}</h2>
          </div>

          <button className="icon-button" onClick={onClose} aria-label="Close">
            <XIcon size={17} />
          </button>
        </div>

        <div className="drawer-status">
          <span className="status-badge">{appointment.status}</span>

          <strong>{appointment.amount}</strong>
        </div>

        <div className="drawer-detail">
          <span>Service</span>
          <strong>{appointment.service}</strong>
        </div>

        <div className="drawer-detail">
          <span>Salon</span>
          <strong>{appointment.salon}</strong>
        </div>

        <div className="drawer-detail">
          <span>Staff</span>
          <strong>{appointment.staff}</strong>
        </div>

        <div className="drawer-detail">
          <span>Time</span>
          <strong>
            {appointment.date.toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
            {" · "}
            {appointment.time}
          </strong>
        </div>

        <div className="drawer-actions">
          <button className="btn btn-primary" onClick={onClose}>
            Confirm appointment
          </button>

          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </aside>
    </div>
  );
}
