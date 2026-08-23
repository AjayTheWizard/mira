"use client";

import {
  createAppointment,
  getAvailableSlots,
  getSalonDetail,
} from "@/app/actions/customer";
import type { SalonDetail, ServiceOption, StaffOption, TimeSlot } from "@/lib/db/customer-types";
import { CalendarDays, Check, Loader2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type Props = {
  branchId: string;
  onClose: () => void;
  onBooked?: () => void;
};

type Step = "service" | "staff" | "slot" | "confirm" | "done";

function nextDays(count: number) {
  const days: { date: string; label: string }[] = [];
  const today = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push({
      date: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }),
    });
  }
  return days;
}

export function BookingModal({ branchId, onClose, onBooked }: Props) {
  const [detail, setDetail] = useState<SalonDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(true);
  const [step, setStep] = useState<Step>("service");

  const [service, setService] = useState<ServiceOption | null>(null);
  const [staffMember, setStaffMember] = useState<StaffOption | null>(null);
  const [date, setDate] = useState(nextDays(1)[0].date);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slot, setSlot] = useState<TimeSlot | null>(null);

  const [booking, setBooking] = useState(false);
  const [error, setError] = useState("");

  const days = useMemo(() => nextDays(10), []);

  useEffect(() => {
    getSalonDetail(branchId).then((d) => {
      setDetail(d);
      setLoadingDetail(false);
    });
  }, [branchId]);

  useEffect(() => {
    if (step !== "slot" || !staffMember || !service) return;
    setLoadingSlots(true);
    setSlot(null);
    getAvailableSlots({
      staffId: staffMember.id,
      date,
      durationMinutes: service.durationMinutes,
    })
      .then(setSlots)
      .finally(() => setLoadingSlots(false));
  }, [step, staffMember, service, date]);

  async function confirmBooking() {
    if (!detail || !service || !staffMember || !slot) return;
    setBooking(true);
    setError("");
    try {
      await createAppointment({
        branchId: detail.branchId,
        salonId: detail.salonId,
        ownerId: detail.ownerId,
        serviceId: service.id,
        staffId: staffMember.id,
        date,
        time: slot.time,
      });
      setStep("done");
      onBooked?.();
    } catch (err: any) {
      setError(err.message ?? "Couldn't book that slot — please try again");
    } finally {
      setBooking(false);
    }
  }

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "white", borderRadius: 16, width: "100%", maxWidth: 480,
          maxHeight: "88vh", overflowY: "auto", padding: 24, position: "relative",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", cursor: "pointer" }}
        >
          <X size={18} />
        </button>

        {loadingDetail && <p className="muted">Loading salon details...</p>}

        {!loadingDetail && detail && (
          <>
            <p className="eyebrow">BOOK AT {detail.name.toUpperCase()}</p>

            {step === "service" && (
              <>
                <h2 style={{ marginTop: 4 }}>Choose a service</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
                  {detail.serviceOptions.length === 0 && (
                    <p className="muted">This salon hasn't added any services yet.</p>
                  )}
                  {detail.serviceOptions.map((s) => (
                    <button
                      key={s.id}
                      className="btn btn-secondary"
                      style={{ justifyContent: "space-between", display: "flex", width: "100%" }}
                      onClick={() => {
                        setService(s);
                        setStep("staff");
                      }}
                    >
                      <span>{s.name} · {s.durationMinutes} min</span>
                      <strong>रू{s.price.toLocaleString("en-IN")}</strong>
                    </button>
                  ))}
                </div>
              </>
            )}

            {step === "staff" && service && (
              <>
                <h2 style={{ marginTop: 4 }}>Choose a stylist</h2>
                <p className="muted">{service.name} · {service.durationMinutes} min</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
                  {detail.staff.length === 0 && (
                    <p className="muted">No staff available at this branch yet.</p>
                  )}
                  {detail.staff.map((st) => (
                    <button
                      key={st.id}
                      className="btn btn-secondary"
                      style={{ justifyContent: "flex-start", display: "flex", width: "100%" }}
                      onClick={() => {
                        setStaffMember(st);
                        setStep("slot");
                      }}
                    >
                      {st.name}{st.role ? ` · ${st.role}` : ""}
                    </button>
                  ))}
                </div>
                <button className="text-button" style={{ marginTop: 12 }} onClick={() => setStep("service")}>
                  ← Back
                </button>
              </>
            )}

            {step === "slot" && service && staffMember && (
              <>
                <h2 style={{ marginTop: 4 }}>Pick a date & time</h2>
                <p className="muted">{service.name} with {staffMember.name}</p>
                <div style={{ display: "flex", gap: 8, overflowX: "auto", marginTop: 12, paddingBottom: 4 }}>
                  {days.map((d) => (
                    <button
                      key={d.date}
                      className={`filter-pill ${date === d.date ? "active" : ""}`}
                      onClick={() => setDate(d.date)}
                      style={{ whiteSpace: "nowrap" }}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                  {loadingSlots && <Loader2 size={16} className="spin" />}
                  {!loadingSlots && slots.length === 0 && (
                    <p className="muted">No open slots this day — try another date.</p>
                  )}
                  {!loadingSlots &&
                    slots.map((s) => (
                      <button
                        key={s.time}
                        className={`filter-pill ${slot?.time === s.time ? "active" : ""}`}
                        onClick={() => setSlot(s)}
                      >
                        {s.label}
                      </button>
                    ))}
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                  <button className="text-button" onClick={() => setStep("staff")}>← Back</button>
                  <button
                    className="btn btn-primary"
                    disabled={!slot}
                    onClick={() => setStep("confirm")}
                    style={{ marginLeft: "auto" }}
                  >
                    Continue
                  </button>
                </div>
              </>
            )}

            {step === "confirm" && service && staffMember && slot && (
              <>
                <h2 style={{ marginTop: 4 }}>Confirm booking</h2>
                <div className="profile-panel" style={{ marginTop: 12 }}>
                  <div className="schedule-row"><CalendarDays size={15} /><span>{days.find((d) => d.date === date)?.label}, {slot.label}</span></div>
                  <div className="schedule-row"><span className="schedule-dot" /><span>{service.name} · {service.durationMinutes} min</span></div>
                  <div className="schedule-row"><span className="schedule-dot" /><span>with {staffMember.name}</span></div>
                  <div className="schedule-row"><span className="schedule-dot" /><strong>रू{service.price.toLocaleString("en-IN")}</strong></div>
                </div>
                {error && <div className="success-note" style={{ marginTop: 12 }}>{error}</div>}
                <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                  <button className="text-button" onClick={() => setStep("slot")}>← Back</button>
                  <button
                    className="btn btn-primary"
                    disabled={booking}
                    onClick={confirmBooking}
                    style={{ marginLeft: "auto" }}
                  >
                    {booking ? "Booking..." : "Confirm booking"}
                  </button>
                </div>
              </>
            )}

            {step === "done" && (
              <div style={{ textAlign: "center", padding: "24px 0" }}>
                <Check size={36} />
                <h2 style={{ marginTop: 12 }}>You're booked!</h2>
                <p className="muted">Find it under My Appointments.</p>
                <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={onClose}>
                  Done
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
