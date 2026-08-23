"use client";

import {
  createService,
  deleteService,
  getServices,
  toggleServiceActive,
  updateService,
} from "@/app/actions/service";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

type ServiceRow = {
  id: string;
  name: string;
  category: string | null;
  description: string | null;
  durationMinutes: number;
  price: number;
  isActive: boolean;
};

const emptyForm = {
  name: "",
  category: "",
  description: "",
  durationMinutes: 30,
  price: 0,
};

export function ServiceView() {
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const rows = await getServices();
    setServices(rows as ServiceRow[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await createService({
        name: form.name,
        category: form.category || undefined,
        description: form.description || undefined,
        durationMinutes: Number(form.durationMinutes),
        price: Number(form.price),
      });
      setForm(emptyForm);
      await load();
    } catch (err: any) {
      setError(err.message ?? "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(id: string, isActive: boolean) {
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isActive: !isActive } : s)),
    );
    try {
      await toggleServiceActive(id, !isActive);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update service",
      );
      await load();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this service?")) return;
    const previous = services;
    setServices((prev) => prev.filter((s) => s.id !== id));
    try {
      await deleteService(id);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete service",
      );
      setServices(previous);
    }
  }

  return (
    <>
      <div className="portal-heading">
        <div>
          <p className="eyebrow">MY SERVICES</p>
          <h1>What customers can book</h1>
          <p className="muted">
            Add the services your salon offers, with duration and price.
          </p>
        </div>
      </div>

      <section className="profile-panel">
        <p className="eyebrow">ADD A SERVICE</p>
        <form onSubmit={handleCreate} className="settings-grid" style={{ gap: 12 }}>
          <label>
            Service name
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Haircut"
              required
            />
          </label>
          <label>
            Category
            <input
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              placeholder="e.g. Hair"
            />
          </label>
          <label>
            Duration (minutes)
            <input
              type="number"
              min={5}
              step={5}
              value={form.durationMinutes}
              onChange={(e) =>
                setForm({ ...form, durationMinutes: Number(e.target.value) })
              }
              required
            />
          </label>
          <label>
            Price (रू)
            <input
              type="number"
              min={0}
              value={form.price}
              onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
              required
            />
          </label>
          <label style={{ gridColumn: "1 / -1" }}>
            Description
            <input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Optional"
            />
          </label>
          {error && <div className="success-note" style={{ gridColumn: "1 / -1" }}>{error}</div>}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving}
            style={{ gridColumn: "1 / -1", justifySelf: "start" }}
          >
            <Plus size={15} /> {saving ? "Adding..." : "Add service"}
          </button>
        </form>
      </section>

      <section className="profile-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">ALL SERVICES</p>
            <h2>{services.length} service{services.length === 1 ? "" : "s"}</h2>
          </div>
        </div>

        {loading && <p className="muted">Loading...</p>}
        {!loading && services.length === 0 && (
          <p className="muted">No services yet — add your first one above.</p>
        )}

        {services.map((s) => (
          <div className="schedule-row" key={s.id}>
            <span className="schedule-dot" />
            <span>
              <strong>{s.name}</strong>
              {s.category ? ` · ${s.category}` : ""} · {s.durationMinutes} min · रू
              {s.price.toLocaleString("en-IN")}
            </span>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input
                  type="checkbox"
                  checked={s.isActive}
                  onChange={() => handleToggle(s.id, s.isActive)}
                />
                Active
              </label>
              <button
                className="icon-button"
                aria-label={`Delete ${s.name}`}
                onClick={() => handleDelete(s.id)}
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
      </section>
    </>
  );
}

export default ServiceView;
