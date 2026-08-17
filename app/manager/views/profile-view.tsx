"use client";

import type { User } from "@/lib/db/types";

type ProfileViewProps = {
  user?: User;
  average: string;
};

export function ProfileView({ user, average }: ProfileViewProps) {
  const name = user?.name ?? "Manager";

  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

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
              <h2>{name}</h2>

              <p className="muted">Salon owner · {average} average rating</p>
            </div>
          </div>

          <label>
            Full name
            <input type="text" defaultValue={user?.name ?? ""} />
          </label>

          <label>
            Email
            <input type="email" defaultValue={user?.email ?? ""} />
          </label>

          <button className="btn btn-primary">Save changes</button>
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

              <input type="checkbox" defaultChecked />
            </div>
          ))}

          <button className="btn btn-secondary">Change password</button>
        </section>
      </div>
    </>
  );
}
