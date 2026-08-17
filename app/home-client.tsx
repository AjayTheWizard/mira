"use client";

import { authClient } from "@/lib/auth-client";
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
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type Role = "customer" | "manager";
type User = { name: string; email: string; role: Role };

type Salon = {
  name: string;
  area: string;
  rating: number;
  reviews: number;
  price: string;
  distance: string;
  open: boolean;
  next: string;
  image: string;
  services: string[];
};
const salons: Salon[] = [
  {
    name: "The Hair & Beauty Studio",
    area: "Thamel, Kathmandu",
    rating: 4.8,
    reviews: 184,
    price: "रू 899",
    distance: "1.2 km",
    open: true,
    next: "Today, 4:30 PM",
    image:
      "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=900&q=80",
    services: ["Haircut", "Hair color", "Facial"],
  },
  {
    name: "Blush & Bloom Salon",
    area: "Jhamsikhel, Lalitpur",
    rating: 4.6,
    reviews: 96,
    price: "रू 699",
    distance: "2.8 km",
    open: true,
    next: "Tomorrow, 10:00 AM",
    image:
      "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=900&q=80",
    services: ["Hair styling", "Manicure", "Spa"],
  },
  {
    name: "Ojas Wellness Lounge",
    area: "Lakeside, Pokhara",
    rating: 4.9,
    reviews: 241,
    price: "रू 1,299",
    distance: "4.1 km",
    open: false,
    next: "Sat, 11:30 AM",
    image:
      "https://images.unsplash.com/photo-1600948836101-f9ffda59d250?auto=format&fit=crop&w=900&q=80",
    services: ["Massage", "Facial", "Pedicure"],
  },
];
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

export default function HomeClient({ user }: { user: User }) {
  const router = useRouter();
  const [tab, setTab] = useState("Home");
  const [query, setQuery] = useState("");
  const [menu, setMenu] = useState(false);
  const [saved, setSaved] = useState<string[]>([salons[0].name]);
  const [notice, setNotice] = useState("");
  const matches = useMemo(
    () =>
      salons.filter((salon) =>
        `${salon.name} ${salon.area} ${salon.services.join(" ")}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [query],
  );
  async function signOut() {
    await authClient.signOut();
    router.push("/sign-in");
    router.refresh();
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
          <div className="brand-mark">m</div>
          <span>
            mira<span className="brand-dot">.</span>
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
          <div className="location-chip">
            <MapPin size={15} />
            <span>Thamel, Kathmandu</span>
            <ChevronRight size={14} />
          </div>
          <div className="top-actions">
            <button
              className="icon-button"
              aria-label="Notifications"
              onClick={() => setNotice("You are all caught up")}
            >
              <Bell size={18} />
            </button>
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
          {notice && (
            <div className="success-note">
              {notice}
              <button onClick={() => setNotice("")}>
                <X size={14} />
              </button>
            </div>
          )}
          {tab === "Home" && (
            <CustomerHome
              user={user}
              query={query}
              setQuery={setQuery}
              matches={matches}
              saved={saved}
              setSaved={setSaved}
              setTab={setTab}
            />
          )}
          {tab === "Explore" && (
            <Explore
              query={query}
              setQuery={setQuery}
              matches={matches}
              saved={saved}
              setSaved={setSaved}
            />
          )}
          {tab === "My Appointments" && <Appointments />}
          {tab === "Settings" && <CustomerSettings user={user} />}
        </div>
      </main>
    </div>
  );
}

function CustomerHome({
  user,
  query,
  setQuery,
  matches,
  saved,
  setSaved,
  setTab,
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
          {matches.map((salon: Salon) => (
            <SalonCard
              key={salon.name}
              salon={salon}
              saved={saved.includes(salon.name)}
              toggle={() =>
                setSaved((items: string[]) =>
                  items.includes(salon.name)
                    ? items.filter((item) => item !== salon.name)
                    : [...items, salon.name],
                )
              }
            />
          ))}
        </div>
      </section>
      <div className="customer-lower">
        <section className="appointment-card">
          <div>
            <p className="eyebrow">UPCOMING APPOINTMENT</p>
            <h2>Saturday, 18 May</h2>
            <p className="muted">
              The Hair & Beauty Studio · Haircut with Ananya
            </p>
          </div>
          <div className="appointment-time">
            10:30 AM<span>Confirmed</span>
          </div>
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

function Explore({ query, setQuery, matches, saved, setSaved }: any) {
  return (
    <>
      <div className="portal-heading">
        <div>
          <p className="eyebrow">EXPLORE</p>
          <h1>Salons around Kathmandu</h1>
          <p className="muted">
            Compare ratings, services, price and availability.
          </p>
        </div>
        <button className="btn btn-secondary">
          <MapPin size={15} /> Use my location
        </button>
      </div>
      <div className="customer-search">
        <Search size={18} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search salons, services or location..."
        />
      </div>
      <div className="filter-row">
        <button className="filter-pill active">Recommended</button>
        <button className="filter-pill">Open now</button>
        <button className="filter-pill">Highest rated</button>
        <button className="filter-pill">Under रू1,000</button>
        <button className="filter-pill">Available today</button>
      </div>
      <div className="explore-layout">
        <div className="salon-list">
          {matches.map((salon: Salon) => (
            <SalonCard
              key={salon.name}
              salon={salon}
              saved={saved.includes(salon.name)}
              toggle={() =>
                setSaved((items: string[]) =>
                  items.includes(salon.name)
                    ? items.filter((item: string) => item !== salon.name)
                    : [...items, salon.name],
                )
              }
              wide
            />
          ))}
        </div>
        <div className="map-placeholder">
          <MapPin size={27} />
          <strong>Explore by location</strong>
          <span>Map view coming next</span>
        </div>
      </div>
    </>
  );
}
function SalonCard({
  salon,
  saved,
  toggle,
  wide,
}: {
  salon: Salon;
  saved: boolean;
  toggle: () => void;
  wide?: boolean;
}) {
  return (
    <article className={`salon-card ${wide ? "wide" : ""}`}>
      <div className="salon-image">
        <img src={salon.image} alt={salon.name} />
        <button
          className={`heart-button ${saved ? "saved" : ""}`}
          onClick={toggle}
          aria-label={`Save ${salon.name}`}
        >
          <Heart size={17} fill={saved ? "currentColor" : "none"} />
        </button>
        <span className={`open-badge ${salon.open ? "" : "closed"}`}>
          {salon.open ? "Open now" : "Closed"}
        </span>
      </div>
      <div className="salon-card-body">
        <div className="salon-card-title">
          <div>
            <h3>{salon.name}</h3>
            <p>{salon.area}</p>
          </div>
          <span className="rating">
            <Star size={13} fill="currentColor" /> {salon.rating}
          </span>
        </div>
        <div className="salon-meta">
          <span>{salon.distance}</span>
          <span>From {salon.price}</span>
          <span>{salon.reviews} reviews</span>
        </div>
        <div className="tag-row">
          {salon.services.map((service) => (
            <span key={service}>{service}</span>
          ))}
        </div>
        <div className="salon-card-footer">
          <span>Next: {salon.next}</span>
          <button className="btn btn-primary btn-small">Book now</button>
        </div>
      </div>
    </article>
  );
}
function Appointments() {
  return (
    <>
      <div className="portal-heading">
        <div>
          <p className="eyebrow">MY APPOINTMENTS</p>
          <h1>Your self-care calendar</h1>
          <p className="muted">Keep track of upcoming and past salon visits.</p>
        </div>
        <button className="btn btn-primary">Book a salon</button>
      </div>
      <div className="tabs">
        <button className="active">Upcoming</button>
        <button>Past</button>
        <button>Cancelled</button>
      </div>
      <section className="appointment-list">
        <div className="appointment-list-row">
          <div className="appointment-date">
            <strong>18</strong>
            <span>May</span>
          </div>
          <div className="appointment-list-copy">
            <h3>The Hair & Beauty Studio</h3>
            <p>Haircut · Ananya Sharma · 10:30 AM · 45 min</p>
            <div className="tag-row">
              <span>Confirmed</span>
              <span>Payment: Pay at salon</span>
            </div>
          </div>
          <button className="text-button">
            View details <ChevronRight size={14} />
          </button>
        </div>
      </section>
    </>
  );
}
function CustomerSettings({ user }: { user: User }) {
  const [saved, setSaved] = useState(false);
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
          <button className="btn btn-primary" onClick={() => setSaved(true)}>
            Save changes
          </button>
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
              <strong>Thamel, Kathmandu</strong>
              <p className="muted">Used for nearby salon recommendations</p>
            </div>
          </div>
          <button className="btn btn-secondary">Use my current location</button>
          <div className="settings-toggle">
            <span>Appointment reminders</span>
            <input type="checkbox" defaultChecked />
          </div>
          <div className="settings-toggle">
            <span>Payment updates</span>
            <input type="checkbox" defaultChecked />
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
              mira<span className="brand-dot">.</span>
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
              Open manager portal <ArrowRightIcon />
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
        <div className="manager-stats">
          <div>
            <span>Today's appointments</span>
            <strong>18</strong>
            <small>+12% this week</small>
          </div>
          <div>
            <span>Today's revenue</span>
            <strong>रू32,480</strong>
            <small>On track</small>
          </div>
          <div>
            <span>Average rating</span>
            <strong>
              4.8 <small>★</small>
            </strong>
            <small>342 reviews</small>
          </div>
          <div>
            <span>Pending payments</span>
            <strong>6</strong>
            <small>Needs attention</small>
          </div>
        </div>
        <div className="manager-home-grid">
          <section className="profile-panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">TODAY'S APPOINTMENTS</p>
                <h2>Keep the day moving</h2>
              </div>
              <button
                className="text-button"
                onClick={() => router.push("/manager")}
              >
                View all <ChevronRight size={14} />
              </button>
            </div>
            {[
              "Riya Kapoor · Hair color · 10:30 AM",
              "Arjun Mehta · Haircut · 11:15 AM",
              "Meera Nair · Facial · 12:00 PM",
            ].map((item) => (
              <div className="schedule-row" key={item}>
                <span className="schedule-dot" />
                <span>{item}</span>
                <strong>Confirmed</strong>
              </div>
            ))}
          </section>
          <section className="profile-panel">
            <p className="eyebrow">PENDING PAYMENTS</p>
            <h2>रू18,650 to collect</h2>
            <p className="muted">
              6 appointments have unpaid or partial balances.
            </p>
            <button
              className="btn btn-primary"
              onClick={() => router.push("/manager")}
            >
              Update payments <ArrowRightIcon />
            </button>
          </section>
        </div>
      </div>
    </main>
  );
}
function ArrowRightIcon() {
  return <ChevronRight size={16} />;
}
