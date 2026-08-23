"use client";

import { useState } from "react";
import { Loader2, XIcon } from "lucide-react";
import { AppointmentViewModel } from "@/lib/db/types";

type Props = {
  appointment: AppointmentViewModel;
  onClose: () => void;
  onStatusChange: (id: string, status: string) => Promise<void>;
};

export function AppointmentDrawer({
  appointment,
  onClose,
  onStatusChange,
}: Props) {
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState("");

  const status = appointment.status.toLowerCase();
  const isOpen = status !== "completed" && status !== "cancelled";

  async function apply(nextStatus: string) {
    setUpdating(nextStatus);
    setError("");
    try {
      await onStatusChange(appointment.id, nextStatus);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update appointment",
      );
    } finally {
      setUpdating(null);
    }
  }

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

        {error && <div className="error-banner">{error}</div>}

        <div className="drawer-actions">
          {(status === "upcoming" || status === "pending") && (
            <button
              className="btn btn-primary"
              onClick={() => apply("confirmed")}
              disabled={updating !== null}
            >
              {updating === "confirmed" && (
                <Loader2 size={14} className="spin" />
              )}
              Confirm appointment
            </button>
          )}

          {status === "confirmed" && (
            <button
              className="btn btn-primary"
              onClick={() => apply("arrived")}
              disabled={updating !== null}
            >
              {updating === "arrived" && (
                <Loader2 size={14} className="spin" />
              )}
              Customer has arrived
            </button>
          )}

          {status === "arrived" && (
            <button
              className="btn btn-primary"
              onClick={() => apply("completed")}
              disabled={updating !== null}
            >
              {updating === "completed" && (
                <Loader2 size={14} className="spin" />
              )}
              Mark completed
            </button>
          )}

          {isOpen && (
            <button
              className="btn btn-ghost"
              onClick={() => apply("cancelled")}
              disabled={updating !== null}
            >
              {updating === "cancelled" && (
                <Loader2 size={14} className="spin" />
              )}
              {status === "confirmed" || status === "upcoming" || status === "pending"
                ? "Cancel — customer didn't show"
                : "Cancel appointment"}
            </button>
          )}

          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </aside>
    </div>
  );
}
