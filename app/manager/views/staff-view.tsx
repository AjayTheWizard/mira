"use client";

import { useEffect, useState } from "react";
import { PlusIcon, Trash2, Loader2 } from "lucide-react";
import {
  getStaff,
  createStaff,
  updateStaff,
  deleteStaff,
  toggleStaffActive,
  getBranches,
} from "@/app/actions/manager";

type BranchOption = {
  id: string;
  name: string;
  city: string | null;
  isActive: boolean;
};
type StaffRow = {
  id: string;
  userId: string;
  salonId: string;
  branchId: string | null;
  name: string;
  role: string | null;
  email: string | null;
  phone: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  salonName: string | null;
};

export function StaffView() {
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [branches, setBranches] = useState<BranchOption[]>([]);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const [staffRows, branchRows] = await Promise.all([
        getStaff(),
        getBranches(),
      ]);
      setStaff(staffRows as StaffRow[]);
      setBranches(branchRows as BranchOption[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load staff");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    refresh();
  }, []);

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget)) as any;
    setSaving(true);
    try {
      await createStaff({
        name: data.name,
        role: data.role,
        email: data.email,
        phone: data.phone,
      });
      e.currentTarget.reset();
      setShowForm(false);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add staff");
    } finally {
      setSaving(false);
    }
  }

  async function handleEditSave(
    id: string,
    e: React.FormEvent<HTMLFormElement>,
  ) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget)) as any;
    setSaving(true);
    try {
      await updateStaff(id, {
        name: data.name,
        role: data.role,
        email: data.email,
        phone: data.phone,
      });
      setEditingId(null);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update staff");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(id: string, current: boolean) {
    setStaff((prev) =>
      prev.map((m) => (m.id === id ? { ...m, isActive: !current } : m)),
    );
    try {
      await toggleStaffActive(id, !current);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status");
      await refresh();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this staff member?")) return;
    const prev = staff;
    setStaff((p) => p.filter((m) => m.id !== id));
    try {
      await deleteStaff(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete staff");
      setStaff(prev);
    }
  }

  return (
    <>
      <div className="manager-view-toolbar">
        <div>
          <p className="eyebrow">MY STAFFS</p>
          <h2>Your team, at a glance</h2>
          <p className="muted">
            Manage specialists, availability and services.
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowForm((v) => !v)}
        >
          <PlusIcon size={15} />
          {showForm ? "Cancel" : "Add staff"}
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {showForm && (
        <form className="branch-form profile-panel" onSubmit={handleAdd}>
          <input name="name" placeholder="Staff name" required />
          <input name="role" placeholder="Specialization / role" />
          <input name="email" placeholder="Email" type="email" />
          <input name="phone" placeholder="Phone" />
          <select name="branchId" defaultValue="" required>
            <option value="" disabled>
              Select branch
            </option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} {b.city ? `· ${b.city}` : ""}
              </option>
            ))}
          </select>
          <button className="btn btn-secondary" disabled={saving}>
            {saving ? (
              <Loader2 size={14} className="spin" />
            ) : (
              <PlusIcon size={14} />
            )}
            Save staff
          </button>
        </form>
      )}

      <div className="staff-table profile-panel">
        <div className="table-head">
          <span>Staff member</span>
          <span>Salon</span>
          <span>Specialization</span>
          <span>Contact</span>
          <span>Status</span>
        </div>

        {loading ? (
          <div className="empty-state">Loading staff…</div>
        ) : staff.length === 0 ? (
          <div className="empty-state">No staff members found.</div>
        ) : (
          staff.map((member) =>
            editingId === member.id ? (
              <form
                key={member.id}
                className="table-row editing"
                onSubmit={(e) => handleEditSave(member.id, e)}
              >
                <input name="name" defaultValue={member.name} required />
                <span>{member.salonName ?? "—"}</span>
                <input name="role" defaultValue={member.role ?? ""} />
                <input name="phone" defaultValue={member.phone ?? ""} />

                <div className="row-actions">
                  <button className="btn btn-secondary" disabled={saving}>
                    Save
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => setEditingId(null)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="table-row" key={member.id}>
                <div
                  className="staff-name"
                  onClick={() => setEditingId(member.id)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="avatar">
                    {member.name.slice(0, 2).toUpperCase()}
                  </div>
                  <strong>{member.name}</strong>
                </div>

                <span>{member.salonName ?? "—"}</span>
                <span>{member.role || "Staff"}</span>
                <span>{member.phone || member.email || "—"}</span>

                <div className="row-actions">
                  <button
                    className="status-badge"
                    onClick={() => handleToggle(member.id, member.isActive)}
                  >
                    {member.isActive ? "Active" : "Inactive"}
                  </button>
                  <button
                    className="icon-button"
                    aria-label="Delete staff"
                    onClick={() => handleDelete(member.id)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ),
          )
        )}
      </div>
    </>
  );
}
