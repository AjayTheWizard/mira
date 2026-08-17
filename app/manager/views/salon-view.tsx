"use client";

import { useEffect, useState } from "react";
import {
  createBranch,
  updateSalon,
  getSalon,
  getBranches,
} from "@/app/actions/manager";
import { PlusIcon, StoreIcon, Loader2 } from "lucide-react";

type SalonRow = {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  phone: string | null;
  email: string | null;
  logoUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
} | null;

type BranchRow = {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  isActive: boolean;
};

const emptySalon = {
  name: "Mira Salon",
  description: "",
  phone: "",
  email: "",
};

export function SalonView() {
  const [salon, setSalon] = useState<SalonRow>(null);
  const [form, setForm] = useState(emptySalon);
  const [branches, setBranches] = useState<BranchRow[]>([]);
  const [salonImage, setSalonImage] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [addingBranch, setAddingBranch] = useState(false);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const [salonRow, branchRows] = await Promise.all([
        getSalon(),
        getBranches(),
      ]);
      setSalon(salonRow as SalonRow);
      setForm({
        name: salonRow?.name ?? emptySalon.name,
        description: salonRow?.description ?? "",
        phone: salonRow?.phone ?? "",
        email: salonRow?.email ?? "",
      });
      setSalonImage(salonRow?.logoUrl ?? "");
      setBranches(branchRows as BranchRow[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load salon");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function saveSalon(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await updateSalon({
        name: form.name,
        description: form.description,
        phone: form.phone,
        email: form.email,
      });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save salon");
    } finally {
      setSaving(false);
    }
  }

  async function addBranch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget)) as any;
    setAddingBranch(true);
    setError(null);
    try {
      await createBranch(data);
      e.currentTarget.reset();
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add branch");
    } finally {
      setAddingBranch(false);
    }
  }

  return (
    <>
      <div className="manager-view-toolbar">
        <div>
          <p className="eyebrow">MY SALONS</p>
          <h2>One brand, every branch</h2>
          <p className="muted">
            Customize your salon identity and manage locations.
          </p>
        </div>
        <button className="btn btn-primary">
          <PlusIcon size={15} /> Add salon
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="manager-dashboard-grid">
        <section className="profile-panel">
          <p className="eyebrow">SALON IDENTITY</p>
          <h2>{form.name || "Mira Salon"}</h2>

          <div className="salon-image-manager">
            {salonImage ? (
              <img src={salonImage} alt="Salon cover" />
            ) : (
              <div className="salon-image-empty">
                <span>m</span>
                <p>Add a cover image to make your salon feel discoverable.</p>
              </div>
            )}
            <label className="upload-button">
              {salonImage ? "Replace cover image" : "Upload cover image"}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setSalonImage(URL.createObjectURL(file));
                }}
              />
            </label>
          </div>

          {loading ? (
            <div className="empty-state">Loading salon…</div>
          ) : (
            <form onSubmit={saveSalon}>
              <label>
                Salon name
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </label>
              <label>
                Description
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </label>
              <div className="two-col">
                <label>
                  Phone
                  <input
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                  />
                </label>
                <label>
                  Email
                  <input
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                  />
                </label>
              </div>
              <button className="btn btn-primary" disabled={saving}>
                {saving ? <Loader2 size={14} className="spin" /> : null}
                Save identity
              </button>
            </form>
          )}
        </section>

        <section className="profile-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">BRANCHES</p>
              <h2>{branches.length} locations</h2>
            </div>
            <StoreIcon size={20} className="mini-icon" />
          </div>

          {loading ? (
            <div className="empty-state">Loading branches…</div>
          ) : (
            branches.map((b) => (
              <div className="branch-row" key={b.id}>
                <div>
                  <strong>{b.name}</strong>
                  <p className="muted">
                    {b.address || "Branch location"} · {b.city || "Bengaluru"}
                  </p>
                </div>
                <span className="status-badge">
                  {b.isActive ? "Open" : "Closed"}
                </span>
              </div>
            ))
          )}

          <form className="branch-form" onSubmit={addBranch}>
            <input name="name" placeholder="New branch name" required />
            <input name="city" placeholder="City" required />
            <input name="address" placeholder="Address" />
            <button className="btn btn-secondary" disabled={addingBranch}>
              {addingBranch ? (
                <Loader2 size={14} className="spin" />
              ) : (
                <PlusIcon size={14} />
              )}
              Add branch
            </button>
          </form>
        </section>
      </div>
    </>
  );
}
