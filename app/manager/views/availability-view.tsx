"use client";

import { getStaff } from "@/app/actions/manager";
import {
  getAvailabilityForStaff,
  setAvailabilityForStaff,
  type DayAvailability,
} from "@/app/actions/availability";
import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type StaffRow = { id: string; name: string; role: string | null; isActive: boolean };

const DAY_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function AvailabilityView() {
  const [staffList, setStaffList] = useState<StaffRow[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const [week, setWeek] = useState<DayAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getStaff().then((rows) => {
      setStaffList(rows as StaffRow[]);
      if (rows[0]) setSelectedStaffId(rows[0].id);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!selectedStaffId) return;
    setSaved(false);
    getAvailabilityForStaff(selectedStaffId).then(setWeek);
  }, [selectedStaffId]);

  function updateDay(dayOfWeek: number, patch: Partial<DayAvailability>) {
    setWeek((prev) =>
      prev.map((d) => (d.dayOfWeek === dayOfWeek ? { ...d, ...patch } : d)),
    );
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      await setAvailabilityForStaff(selectedStaffId, week);
      setSaved(true);
    } catch (err: any) {
      setError(err.message ?? "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="portal-heading">
        <div>
          <p className="eyebrow">AVAILABILITY</p>
          <h1>Set working hours</h1>
          <p className="muted">
            Customers can only book slots inside these hours. Turn a day off if
            a staff member doesn't work it.
          </p>
        </div>
      </div>

      {loading && <p className="muted">Loading staff...</p>}

      {!loading && staffList.length === 0 && (
        <p className="muted">
          Add a staff member first, then set their hours here.
        </p>
      )}

      {!loading && staffList.length > 0 && (
        <section className="profile-panel">
          <Label>
            Staff member
            <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a staff member">
                  {(() => {
                    const staff = staffList.find(
                      (s) => s.id === selectedStaffId,
                    );

                    return staff
                      ? `${staff.name}${staff.role ? ` · ${staff.role}` : ""}`
                      : "Select a staff member";
                  })()}
                </SelectValue>
              </SelectTrigger>

              <SelectContent>
                {staffList.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                    {s.role ? ` · ${s.role}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Label>
          <div
            style={{
              marginTop: 16,
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            {week.map((day) => (
              <div
                key={day.dayOfWeek}
                className="schedule-row"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    width: 150,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={day.isAvailable}
                    onChange={(e) =>
                      updateDay(day.dayOfWeek, {
                        isAvailable: e.target.checked,
                      })
                    }
                  />
                  {DAY_LABELS[day.dayOfWeek]}
                </label>
                {day.isAvailable && (
                  <>
                    <input
                      type="time"
                      value={day.startTime}
                      onChange={(e) =>
                        updateDay(day.dayOfWeek, { startTime: e.target.value })
                      }
                    />
                    <span>to</span>
                    <input
                      type="time"
                      value={day.endTime}
                      onChange={(e) =>
                        updateDay(day.dayOfWeek, { endTime: e.target.value })
                      }
                    />
                  </>
                )}
                {!day.isAvailable && <span className="muted">Closed</span>}
              </div>
            ))}
          </div>

          {error && (
            <div className="success-note" style={{ marginTop: 12 }}>
              {error}
            </div>
          )}
          {saved && (
            <div className="success-note" style={{ marginTop: 12 }}>
              Hours saved.
            </div>
          )}

          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving}
            style={{ marginTop: 16 }}
          >
            {saving ? "Saving..." : "Save hours"}
          </button>
        </section>
      )}
    </>
  );
}

export default AvailabilityView;
