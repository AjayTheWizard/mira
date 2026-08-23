import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function ProfilePage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in')
  const role = (session.user as { role?: string }).role || 'customer'
  return (
    <main className="profile-page">
      <div className="profile-shell">
        <Link href="/" className="back-link">
          ← Back to AuraSync
        </Link>
        <div className="profile-hero">
          <div className="avatar profile-avatar">
            {session.user.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="eyebrow">MY PROFILE</p>
            <h1>{session.user.name}</h1>
            <p className="muted">
              {session.user.email} ·{" "}
              {role === "manager" ? "Salon manager" : "Customer"}
            </p>
          </div>
        </div>
        <div className="profile-grid">
          <section className="profile-panel">
            <p className="eyebrow">ACCOUNT</p>
            <h2>Your personal details</h2>
            <div className="detail-list">
              <div>
                <span>Name</span>
                <strong>{session.user.name}</strong>
              </div>
              <div>
                <span>Email</span>
                <strong>{session.user.email}</strong>
              </div>
              <div>
                <span>Account type</span>
                <strong>{role === "manager" ? "Manager" : "Customer"}</strong>
              </div>
            </div>
          </section>
          {role === "manager" ? (
            <section className="profile-panel">
              <p className="eyebrow">MANAGER TOOLS</p>
              <h2>Run your salon</h2>
              <p className="muted">
                Customize your salon brand, add branches, review ratings, and
                manually update payment statuses.
              </p>
              <Link className="btn btn-primary" href="/manager">
                Open manager workspace →
              </Link>
            </section>
          ) : (
            <section className="profile-panel">
              <p className="eyebrow">CUSTOMER TOOLS</p>
              <h2>Your beauty routine</h2>
              <p className="muted">
                Manage appointments, saved salons, and your ratings from the
                main workspace.
              </p>
              <Link className="btn btn-primary" href="/">
                Open customer workspace →
              </Link>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
