"use client";

import { SubmitEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { setAccountRole } from "@/app/actions/account";

export function AuthForm({ mode }: { mode: "sign-in" | "sign-up" }) {
  const router = useRouter();

  const [role, setRole] = useState<"customer" | "manager">("customer");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: SubmitEvent) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      if (mode === "sign-up") {
        // Create the Better Auth account
        const result = await authClient.signUp.email({
          name,
          email,
          password,
        });

        if (result.error) {
          setError(result.error.message || "Unable to create account");
          return;
        }

        // Set the selected role for the newly created user
        await setAccountRole(role);

        // Redirect based on the role selected during signup
        router.push(role === "manager" ? "/manager" : "/");
        router.refresh();

        return;
      }

      // Sign in
      const result = await authClient.signIn.email({
        email,
        password,
      });

      if (result.error) {
        setError(result.error.message || "Unable to sign in");
        return;
      }

      // Get the actual role from the authenticated session.
      // Do NOT use the local `role` state here.
      const session = await authClient.getSession();

      if (!session.data?.user) {
        setError("Unable to retrieve your session");
        return;
      }

      const userRole = session.data.user?.role;

      if (userRole === "manager") {
        router.push("/manager");
      } else {
        router.push("/");
      }

      router.refresh();
    } catch (error) {
      console.error(error);

      setError(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">
            m
          </div>

          <span>
            mira<span className="brand-dot">.</span>
          </span>
        </div>

        <p className="eyebrow">
          {mode === "sign-up" ? "JOIN AuraSync" : "WELCOME BACK"}
        </p>

        <h1>
          {mode === "sign-up" ? "Create your account" : "Sign in to AuraSync"}
        </h1>

        <p className="muted">
          {mode === "sign-up"
            ? "Your salon routine, beautifully organized."
            : "Pick up where you left off."}
        </p>

        <form onSubmit={submit}>
          {mode === "sign-up" && (
            <label>
              Full name
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Aarav Khanna"
              />
            </label>
          )}

          <label>
            Email address
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </label>

          <label>
            Password
            <input
              required
              minLength={8}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
            />
          </label>

          {mode === "sign-up" && (
            <fieldset>
              <legend>I’m joining as</legend>

              <div className="role-options">
                <button
                  type="button"
                  className={role === "customer" ? "selected" : ""}
                  onClick={() => setRole("customer")}
                >
                  <strong>Customer</strong>
                  <span>Discover and book salons</span>
                </button>

                <button
                  type="button"
                  className={role === "manager" ? "selected" : ""}
                  onClick={() => setRole("manager")}
                >
                  <strong>Manager</strong>
                  <span>Run my salon business</span>
                </button>
              </div>
            </fieldset>
          )}

          {error && <p className="form-error">{error}</p>}

          <button
            type="submit"
            className="btn btn-primary full-button"
            disabled={loading}
          >
            {loading
              ? "Please wait…"
              : mode === "sign-up"
                ? "Create account"
                : "Sign in"}
          </button>
        </form>

        <p className="auth-switch">
          {mode === "sign-up" ? "Already have an account?" : "New to AuraSync?"}{" "}
          <Link href={mode === "sign-up" ? "/sign-in" : "/sign-up"}>
            {mode === "sign-up" ? "Sign in" : "Create one"}
          </Link>
        </p>
      </section>
    </main>
  );
}
