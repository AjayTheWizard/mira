"use client";

import { Check } from "lucide-react";
import type { NotificationItem } from "@/lib/db/notification-types";

export function NotificationPanel({
  notifications,
  unreadCount,
  onClose,
  onMarkRead,
  onMarkAllRead,
}: {
  notifications: NotificationItem[];
  unreadCount: number;
  onClose: () => void;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
}) {
  return (
    <>
      <div
        style={{ position: "fixed", inset: 0, zIndex: 40 }}
        onClick={onClose}
      />
      <div
        className="profile-panel"
        style={{
          position: "absolute",
          top: "calc(100% + 8px)",
          right: 0,
          width: "40vw",
          maxHeight: 420,
          overflowY: "auto",
          zIndex: 41,
          padding: "0.75rem",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "0.5rem",
          }}
        >
          <strong>Notifications</strong>
          {unreadCount > 0 && (
            <button className="text-button" onClick={onMarkAllRead}>
              Mark all read
            </button>
          )}
        </div>

        {notifications.length === 0 && (
          <p className="muted">You&apos;re all caught up.</p>
        )}

        {notifications.map((n) => (
          <div
            key={n.id}
            className="table-row"
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "0.5rem",
              opacity: n.isRead ? 0.6 : 1,
            }}
          >
            <div style={{ flex: 1 }}>
              <strong>{n.title}</strong>
              <p className="muted" style={{ margin: "2px 0" }}>
                {n.body}
              </p>
              <span className="muted" style={{ fontSize: "0.75rem" }}>
                {n.createdAt.toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                })}{" "}
                ·{" "}
                {n.createdAt.toLocaleTimeString("en-IN", {
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </span>
            </div>
            {!n.isRead && (
              <button
                className="icon-button"
                aria-label="Mark as read"
                onClick={() => onMarkRead(n.id)}
              >
                <Check size={15} />
              </button>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
