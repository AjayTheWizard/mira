"use client";

import { authClient } from "@/lib/auth-client";
import {
  cancelAppointment,
  getExploreSalons,
  markAllNotificationsRead,
  markNotificationRead,
  submitRating,
  toggleFavorite,
  updatePreferences,
} from "@/app/actions/customer";
import { BookingModal } from "@/components/booking-modal";
import {
  CustomerLocationSearch,
  type CustomerLocation,
} from "@/components/customer-location-search";
import { NotificationPanel } from "@/components/notification-panel";
import type {
  ExploreSalon,
  MyAppointment,
  CustomerPreferences,
} from "@/lib/db/customer-types";
import type { NotificationItem } from "@/lib/db/notification-types";
import { formatDistance } from "@/lib/geo";
import {
  Bell,
  CalendarDays,
  ChevronRight,
  Heart,
  Home,
  LogOut,
  MapPin,
  Menu,
  Search,
  Settings,
  Star,
  UserRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type Role = "customer" | "manager";
type User = { name: string; email: string; role: Role };

// Statuses that mean the visit hasn't happened yet (or is in progress) —
// used to decide what counts as an "upcoming" appointment on the portal.
const ACTIVE_APPOINTMENT_STATUSES = new Set(["upcoming", "confirmed", "arrived"]);

const categories = [
  "Haircut",
  "Hair Styling",
  "Beard",
  "Facial",
  "Hair Coloring",
  "Manicure",
  "Pedicure",
  "Spa",
];

type HomeClientProps = {
  user: User;
  initialSalons: ExploreSalon[];
  initialFavoriteIds: string[];
  initialAppointments: MyAppointment[];
  initialPreferences: CustomerPreferences;
  initialUnreadCount: number;
  initialNotifications: NotificationItem[];
};

export default function HomeClient({
  user,
  initialSalons,
  initialFavoriteIds,
  initialAppointments,
  initialPreferences,
  initialUnreadCount,
  initialNotifications,
}: HomeClientProps) {
  const router = useRouter();
  const [tab, setTab] = useState("Home");
  const [query, setQuery] = useState("");
  const [menu, setMenu] = useState(false);

  const [salons, setSalons] = useState<ExploreSalon[]>(initialSalons);
  const [loadingSalons, setLoadingSalons] = useState(false);
  const [location, setLocation] = useState<CustomerLocation | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<string[]>(initialFavoriteIds);
  const [bookingBranchId, setBookingBranchId] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [notifOpen, setNotifOpen] = useState(false);

  const matches = useMemo(
    () =>
      salons.filter((salon) =>
        `${salon.name} ${salon.area} ${salon.services.join(" ")}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [query, salons],
  );

  // Re-fetch, sorted by distance, whenever the location changes.
  useEffect(() => {
    setLoadingSalons(true);
    getExploreSalons(location ? { lat: location.lat, lng: location.lng } : undefined)
      .then(setSalons)
      .finally(() => setLoadingSalons(false));
  }, [location]);

  async function signOut() {
    await authClient.signOut();
    router.push("/sign-in");
    router.refresh();
  }

  async function handleToggleFavorite(salonId: string) {
    setFavoriteIds((ids) =>
      ids.includes(salonId) ? ids.filter((id) => id !== salonId) : [...ids, salonId],
    );
    await toggleFavorite(salonId);
  }

  function handleBellClick() {
    setNotifOpen((open) => !open);
  }

  async function handleMarkRead(id: string) {
    const target = notifications.find((n) => n.id === id);
    if (!target || target.isRead) return;
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
    setUnreadCount((count) => Math.max(0, count - 1));
    await markNotificationRead(id);
  }

  async function handleMarkAllRead() {
    if (unreadCount === 0) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    await markAllNotificationsRead();
  }

  if (user.role === "manager")
    return <ManagerHome user={user} signOut={signOut} />;

  function nav(next: string) {
    setTab(next);
    setMenu(false);
  }

  return (
    <div className="portal-shell">
      <aside className={`portal-sidebar ${menu ? "mobile-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark">a</div>
          <span>
            AuraSync<span className="brand-dot">.</span>
          </span>
        </div>
        <p className="nav-label">Customer portal</p>
        <nav>
          {[
            ["Home", Home],
            ["Explore", Search],
            ["My Appointments", CalendarDays],
            ["Settings", Settings],
          ].map(([label, Icon]) => (
            <button
              key={label as string}
              className={`nav-item ${tab === label ? "active" : ""}`}
              onClick={() => nav(label as string)}
            >
              <Icon size={17} />
              <span>{label as string}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button className="nav-item" onClick={signOut}>
            <LogOut size={17} />
            <span>Log out</span>
          </button>
        </div>
      </aside>
      <main className="portal-main">
        <header className="portal-topbar">
          <button
            className="mobile-menu"
            onClick={() => setMenu(!menu)}
            aria-label="Open navigation"
          >
            <Menu size={20} />
          </button>
          <CustomerLocationSearch value={location} onChange={setLocation} />
          <div className="top-actions">
            <div style={{ position: "relative" }}>
              <button
                className="icon-button"
                aria-label="Notifications"
                onClick={handleBellClick}
                style={{ position: "relative" }}
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span
                    style={{
                      position: "absolute", top: -2, right: -2, width: 8, height: 8,
                      borderRadius: "50%", background: "#e0435c",
                    }}
                  />
                )}
              </button>
              {notifOpen && (
                <NotificationPanel
                  notifications={notifications}
                  unreadCount={unreadCount}
                  onClose={() => setNotifOpen(false)}
                  onMarkRead={handleMarkRead}
                  onMarkAllRead={handleMarkAllRead}
                />
              )}
            </div>
            <button className="user-mini" onClick={() => nav("Settings")}>
              <div className="avatar">
                {user.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="user-mini-copy">
                <strong>{user.name}</strong>
                <span>Customer</span>
              </div>
            </button>
          </div>
        </header>
        <div className="portal-content">
          {tab === "Home" && (
            <CustomerHome
              user={user}
              query={query}
              setQuery={setQuery}
              matches={matches}
              favoriteIds={favoriteIds}
              toggleFavorite={handleToggleFavorite}
              setTab={setTab}
              onBook={setBookingBranchId}
              nextAppointment={initialAppointments.find((a) => ACTIVE_APPOINTMENT_STATUSES.has(a.status))}
            />
          )}
          {tab === "Explore" && (
            <Explore
              query={query}
              setQuery={setQuery}
              matches={matches}
              favoriteIds={favoriteIds}
              toggleFavorite={handleToggleFavorite}
              loading={loadingSalons}
              onBook={setBookingBranchId}
            />
          )}
          {tab === "My Appointments" && (
            <Appointments initialAppointments={initialAppointments} />
          )}
          {tab === "Settings" && (
            <CustomerSettings
              user={user}
              initialPreferences={initialPreferences}
              location={location}
              setLocation={setLocation}
            />
          )}
        </div>
      </main>

      {bookingBranchId && (
        <BookingModal
          branchId={bookingBranchId}
          onClose={() => setBookingBranchId(null)}
        />
      )}
    </div>
  );
}

function CustomerHome({
  user,
  query,
  setQuery,
  matches,
  favoriteIds,
  toggleFavorite,
  setTab,
  onBook,
  nextAppointment,
}: any) {
  return (
    <>
      <div className="portal-heading">
        <div>
          <p className="eyebrow">CUSTOMER HOME</p>
          <h1>Find the perfect salon near you</h1>
          <p className="muted">
            A little time for yourself goes a long way,{" "}
            {user.name.split(" ")[0]}.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setTab("Explore")}>
          <Search size={15} /> Explore salons
        </button>
      </div>
      <div className="customer-search">
        <Search size={18} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search salons or services..."
        />
        <span>⌘ K</span>
      </div>
      <div className="category-row">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => {
              setQuery(category);
              setTab("Explore");
            }}
          >
            {category}
          </button>
        ))}
      </div>
      <section className="portal-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">NEARBY SALONS</p>
            <h2>Places worth making time for</h2>
          </div>
          <button className="text-button" onClick={() => setTab("Explore")}>
            View all <ChevronRight size={15} />
          </button>
        </div>
        <div className="salon-grid">
          {matches.slice(0, 6).map((salon: ExploreSalon) => (
            <SalonCard
              key={salon.branchId}
              salon={salon}
              saved={favoriteIds.includes(salon.salonId)}
              toggle={() => toggleFavorite(salon.salonId)}
              onBook={() => onBook(salon.branchId)}
            />
          ))}
          {matches.length === 0 && (
            <p className="muted">No salons found yet — check back soon.</p>
          )}
        </div>
      </section>
      <div className="customer-lower">
        <section className="appointment-card">
          <div>
            <p className="eyebrow">UPCOMING APPOINTMENT</p>
            {nextAppointment ? (
              <>
                <h2>
                  {nextAppointment.appointmentDate.toLocaleDateString("en-IN", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </h2>
                <p className="muted">
                  {nextAppointment.salonName} · {nextAppointment.serviceName}
                  {nextAppointment.staffName ? ` with ${nextAppointment.staffName}` : ""}
                </p>
              </>
            ) : (
              <>
                <h2>Nothing booked yet</h2>
                <p className="muted">Explore salons and book your next visit.</p>
              </>
            )}
          </div>
          {nextAppointment && (
            <div className="appointment-time">
              {nextAppointment.appointmentDate.toLocaleTimeString("en-IN", {
                hour: "numeric",
                minute: "2-digit",
              })}
              <span>Confirmed</span>
            </div>
          )}
        </section>
        <section className="tip-card">
          <p className="eyebrow">YOUR NEXT VISIT</p>
          <h2>Take a moment for you.</h2>
          <p>
            Save your favorite salons and find your next available slot in a few
            taps.
          </p>
        </section>
      </div>
    </>
  );
}

function Explore({
  query,
  setQuery,
  matches,
  favoriteIds,
  toggleFavorite,
  loading,
  onBook,
}: any) {
  return (
    <>
      <div className="portal-heading">
        <div>
          <p className="eyebrow">EXPLORE</p>
          <h1>Salons around you</h1>
          <p className="muted">
            Compare ratings, services, price and availability.
          </p>
        </div>
      </div>
      <div className="customer-search">
        <Search size={18} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search salons, services or location..."
        />
      </div>
      <div className="explore-layout">
        <div className="salon-list">
          {loading && <p className="muted">Loading salons...</p>}
          {!loading &&
            matches.map((salon: ExploreSalon) => (
              <SalonCard
                key={salon.branchId}
                salon={salon}
                saved={favoriteIds.includes(salon.salonId)}
                toggle={() => toggleFavorite(salon.salonId)}
                onBook={() => onBook(salon.branchId)}
                wide
              />
            ))}
          {!loading && matches.length === 0 && (
            <p className="muted">No salons match that search.</p>
          )}
        </div>
        <div className="map-placeholder">
          <MapPin size={27} />
          <strong>Explore by location</strong>
          <span>Set your location above to sort by distance</span>
        </div>
      </div>
    </>
  );
}

function SalonCard({
  salon,
  saved,
  toggle,
  onBook,
  wide,
}: {
  salon: ExploreSalon;
  saved: boolean;
  toggle: () => void;
  onBook: () => void;
  wide?: boolean;
}) {
  return (
    <article className={`salon-card ${wide ? "wide" : ""}`}>
      <div className="salon-image">
        <img
          src={
            salon.logoUrl ||
            "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=900&q=80"
          }
          alt={salon.name}
        />
        <button
          className={`heart-button ${saved ? "saved" : ""}`}
          onClick={toggle}
          aria-label={`Save ${salon.name}`}
        >
          <Heart size={17} fill={saved ? "currentColor" : "none"} />
        </button>
        <span className={`open-badge ${salon.isActive ? "" : "closed"}`}>
          {salon.isActive ? "Open" : "Temporarily unavailable"}
        </span>
      </div>
      <div className="salon-card-body">
        <div className="salon-card-title">
          <div>
            <h3>{salon.name}</h3>
            <p>{salon.area}</p>
          </div>
          <span className="rating">
            <Star size={13} fill="currentColor" />{" "}
            {salon.rating > 0 ? salon.rating : "New"}
          </span>
        </div>
        <div className="salon-meta">
          <span>
            {salon.distanceKm != null ? formatDistance(salon.distanceKm) : salon.area}
          </span>
          <span>{salon.fromPrice != null ? `From रू${salon.fromPrice}` : "Prices vary"}</span>
          <span>{salon.reviewCount} reviews</span>
        </div>
        <div className="tag-row">
          {salon.services.slice(0, 3).map((service) => (
            <span key={service}>{service}</span>
          ))}
        </div>
        <div className="salon-card-footer">
          <span>{salon.services.length} service{salon.services.length === 1 ? "" : "s"}</span>
          <button
            className="btn btn-primary btn-small"
            disabled={!salon.isActive}
            onClick={onBook}
          >
            Book now
          </button>
        </div>
      </div>
    </article>
  );
}

function Appointments({ initialAppointments }: { initialAppointments: MyAppointment[] }) {
  const [appointments, setAppointments] = useState(initialAppointments);
  const [filter, setFilter] = useState<"Upcoming" | "Past" | "Cancelled">("Upcoming");
  const [ratingFor, setRatingFor] = useState<string | null>(null);
  const [ratingScore, setRatingScore] = useState(5);
  const [ratingComment, setRatingComment] = useState("");
  const [ratingSaving, setRatingSaving] = useState(false);
  const [ratingError, setRatingError] = useState<string | null>(null);

  async function handleCancel(id: string) {
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "cancelled" } : a)),
    );
    await cancelAppointment(id);
  }

  function openRating(id: string) {
    setRatingFor(id);
    setRatingScore(5);
    setRatingComment("");
    setRatingError(null);
  }

  async function handleSubmitRating(id: string) {
    setRatingSaving(true);
    setRatingError(null);
    try {
      await submitRating({ appointmentId: id, score: ratingScore, comment: ratingComment });
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, rated: true } : a)),
      );
      setRatingFor(null);
    } catch (err) {
      setRatingError(err instanceof Error ? err.message : "Failed to submit rating");
    } finally {
      setRatingSaving(false);
    }
  }

  const filtered = appointments.filter((a) => {
    if (filter === "Upcoming") return ACTIVE_APPOINTMENT_STATUSES.has(a.status);
    if (filter === "Cancelled") return a.status === "cancelled";
    return a.status === "completed";
  });

  return (
    <>
      <div className="portal-heading">
        <div>
          <p className="eyebrow">MY APPOINTMENTS</p>
          <h1>Your self-care calendar</h1>
          <p className="muted">Keep track of upcoming and past salon visits.</p>
        </div>
      </div>
      <div className="tabs">
        {(["Upcoming", "Past", "Cancelled"] as const).map((f) => (
          <button key={f} className={filter === f ? "active" : ""} onClick={() => setFilter(f)}>
            {f}
          </button>
        ))}
      </div>
      <section className="appointment-list">
        {filtered.length === 0 && <p className="muted">Nothing here yet.</p>}
        {filtered.map((appt) => (
          <div className="appointment-list-row" key={appt.id}>
            <div className="appointment-date">
              <strong>{appt.appointmentDate.getDate()}</strong>
              <span>{appt.appointmentDate.toLocaleDateString("en-IN", { month: "short" })}</span>
            </div>
            <div className="appointment-list-copy">
              <h3>{appt.salonName}</h3>
              <p>
                {appt.serviceName}
                {appt.staffName ? ` · ${appt.staffName}` : ""} ·{" "}
                {appt.appointmentDate.toLocaleTimeString("en-IN", {
                  hour: "numeric",
                  minute: "2-digit",
                })}{" "}
                · {appt.durationMinutes} min
              </p>
              <div className="tag-row">
                <span>{appt.status.replace(/^./, (c) => c.toUpperCase())}</span>
                <span>रू{appt.amount.toLocaleString("en-IN")}</span>
              </div>
              {appt.status === "arrived" && (
                <p className="success-note">
                  You're checked in — your stylist will be with you shortly.
                </p>
              )}
            </div>
            {appt.status === "upcoming" && (
              <button className="text-button" onClick={() => handleCancel(appt.id)}>
                Cancel
              </button>
            )}
            {appt.status === "completed" && !appt.rated && ratingFor !== appt.id && (
              <button className="text-button" onClick={() => openRating(appt.id)}>
                Rate this visit
              </button>
            )}
            {appt.status === "completed" && appt.rated && (
              <span className="muted">Rated</span>
            )}
            {ratingFor === appt.id && (
              <div className="rating-form">
                <div className="star-picker">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      className="icon-button"
                      aria-label={`${n} star${n === 1 ? "" : "s"}`}
                      onClick={() => setRatingScore(n)}
                    >
                      <Star size={16} fill={n <= ratingScore ? "currentColor" : "none"} />
                    </button>
                  ))}
                </div>
                <textarea
                  placeholder="Add a comment (optional)"
                  value={ratingComment}
                  onChange={(e) => setRatingComment(e.target.value)}
                />
                {ratingError && <p className="error-banner">{ratingError}</p>}
                <div className="row-actions">
                  <button
                    className="btn btn-primary"
                    disabled={ratingSaving}
                    onClick={() => handleSubmitRating(appt.id)}
                  >
                    Submit rating
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => setRatingFor(null)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </section>
    </>
  );
}

function CustomerSettings({
  user,
  initialPreferences,
  location,
  setLocation,
}: {
  user: User;
  initialPreferences: CustomerPreferences;
  location: CustomerLocation | null;
  setLocation: (l: CustomerLocation | null) => void;
}) {
  const [saved, setSaved] = useState(false);
  const [notifications, setNotifications] = useState(initialPreferences.notificationsEnabled);
  const [paymentUpdates, setPaymentUpdates] = useState(initialPreferences.paymentRemindersEnabled);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaved(true);
  }

  async function saveTogglePrefs(next: { notificationsEnabled?: boolean; paymentRemindersEnabled?: boolean }) {
    await updatePreferences({
      location: location?.label ?? initialPreferences.location,
      ...next,
    });
  }

  return (
    <>
      <div className="portal-heading">
        <div>
          <p className="eyebrow">SETTINGS</p>
          <h1>Your profile & preferences</h1>
          <p className="muted">
            Keep your account and salon preferences up to date.
          </p>
        </div>
      </div>
      <div className="settings-grid">
        <section className="profile-panel">
          <div className="profile-hero compact">
            <div className="profile-avatar avatar">
              {user.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h2>{user.name}</h2>
              <p className="muted">{user.email}</p>
            </div>
          </div>
          <form onSubmit={saveProfile}>
            <label>
              Full name
              <input defaultValue={user.name} />
            </label>
            <label>
              Email
              <input defaultValue={user.email} />
            </label>
            <label>
              Phone number
              <input placeholder="Add your phone number" />
            </label>
            <button className="btn btn-primary" type="submit">
              Save changes
            </button>
          </form>
          {saved && (
            <div className="success-note">Profile updated successfully.</div>
          )}
        </section>
        <section className="profile-panel">
          <p className="eyebrow">MY LOCATION</p>
          <h2>Default location</h2>
          <div className="location-setting">
            <MapPin size={18} />
            <div>
              <strong>{location?.label ?? initialPreferences.location ?? "Not set"}</strong>
              <p className="muted">Used for nearby salon recommendations</p>
            </div>
          </div>
          <CustomerLocationSearch
            value={location}
            onChange={(l) => {
              setLocation(l);
              updatePreferences({ location: l?.label ?? null });
            }}
          />
          <div className="settings-toggle">
            <span>Appointment reminders</span>
            <input
              type="checkbox"
              checked={notifications}
              onChange={(e) => {
                setNotifications(e.target.checked);
                saveTogglePrefs({ notificationsEnabled: e.target.checked });
              }}
            />
          </div>
          <div className="settings-toggle">
            <span>Payment updates</span>
            <input
              type="checkbox"
              checked={paymentUpdates}
              onChange={(e) => {
                setPaymentUpdates(e.target.checked);
                saveTogglePrefs({ paymentRemindersEnabled: e.target.checked });
              }}
            />
          </div>
        </section>
      </div>
    </>
  );
}

function ManagerHome({ user, signOut }: { user: User; signOut: () => void }) {
  const router = useRouter();
  return (
    <main className="manager-page">
      <div className="manager-shell">
        <div className="manager-topbar">
          <div className="brand">
            <div className="brand-mark">m</div>
            <span>
              AuraSync<span className="brand-dot">.</span>
            </span>
          </div>
          <div className="manager-user">
            <div className="avatar">{user.name.slice(0, 2).toUpperCase()}</div>
            <div>
              <strong>{user.name}</strong>
              <span>Salon manager</span>
            </div>
            <button
              className="icon-button"
              aria-label="Log out"
              onClick={signOut}
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
        <div className="page-header manager-hero">
          <div>
            <p className="eyebrow">MANAGER HOME</p>
            <h1>Good morning, {user.name.split(" ")[0]}.</h1>
            <p className="muted">
              A clear view of every salon, appointment and payment.
            </p>
          </div>
          <div className="header-actions">
            <button
              className="btn btn-secondary"
              onClick={() => router.push("/profile")}
            >
              <UserRound size={16} /> Profile
            </button>
            <button
              className="btn btn-primary"
              onClick={() => router.push("/manager")}
            >
              Open manager portal <ChevronRight size={16} />
            </button>
          </div>
        </div>
        <section className="manager-command">
          <div>
            <span className="banner-kicker">TODAY AT A GLANCE</span>
            <h2>Make every visit feel exceptional.</h2>
            <p>
              Run multiple salon locations with less admin and more time for
              your team.
            </p>
          </div>
          <div className="command-actions">
            <button onClick={() => router.push("/manager")}>Add salon</button>
            <button onClick={() => router.push("/manager")}>Add staff</button>
            <button onClick={() => router.push("/manager")}>
              View appointments
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
