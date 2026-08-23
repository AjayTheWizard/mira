"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import type { User } from "@/lib/db/types";
import { updateAccountProfile } from "@/app/actions/account";

type ProfileViewProps = {
  user?: User;
  average: string;
};

export function ProfileView({ user, average }: ProfileViewProps) {
  const router = useRouter();

  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const initials = (name || "Manager")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);

    try {
      await updateAccountProfile({ name, email });
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="manager-view-toolbar">
        <div>
          <p className="eyebrow">PROFILE</p>
          <h2>Account settings</h2>
          <p className="muted">Manage your account, preferences and access.</p>
        </div>
      </div>

      <div className="settings-grid">
        <section className="profile-panel">
          <div className="profile-hero compact">
            <div className="profile-avatar avatar">{initials}</div>

            <div>
              <h2>{name || "Manager"}</h2>

              <p className="muted">Salon owner · {average} average rating</p>
            </div>
          </div>

          <form onSubmit={handleSave}>
            <label>
              Full name
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </label>

            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>

            {error && <div className="error-banner">{error}</div>}
            {saved && <div className="success-note">Profile updated.</div>}

            <button className="btn btn-primary" disabled={saving}>
              {saving && <Loader2 size={14} className="spin" />}
              Save changes
            </button>
          </form>
        </section>

        <section className="profile-panel">
          <p className="eyebrow">NOTIFICATIONS</p>

          <h2>Stay in the loop</h2>

          {[
            "New booking notifications",
            "Payment updates",
            "Cancellation notifications",
            "Appointment reminders",
          ].map((item) => (
            <div className="settings-toggle" key={item}>
              <span>{item}</span>

              <input type="checkbox" defaultChecked disabled title="Coming soon" />
            </div>
          ))}

          <button className="btn btn-secondary" disabled title="Coming soon">
            Change password
          </button>
        </section>
      </div>
    </>
  );
}
