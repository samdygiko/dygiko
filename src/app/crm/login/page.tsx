"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import DygikoLogo from "@/components/DygikoLogo";

export default function CRMLoginPage() {
  const { user, loading, signIn } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace("/crm");
    }
  }, [loading, user, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await signIn(email, password);
      router.replace("/crm");
    } catch (err) {
      const code = (err as { code?: string }).code ?? "";
      if (code === "auth/operation-not-allowed") {
        setError("Email/Password sign-in is not enabled. Go to Firebase Console → Authentication → Sign-in methods and enable it.");
      } else if (code === "auth/user-not-found" || code === "auth/wrong-password" || code === "auth/invalid-credential") {
        setError("Incorrect email or password.");
      } else if (code === "auth/invalid-email") {
        setError("Invalid email address.");
      } else if (code === "auth/too-many-requests") {
        setError("Too many failed attempts. Try again later or reset your password.");
      } else {
        setError(`Sign-in failed: ${code || "unknown error"}`);
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "#080808" }}
      >
        <div
          className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: "#b0ff00", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "#080808" }}
    >
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-2 mb-10">
          <DygikoLogo iconSize={28} />
          <span className="text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>
            {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}
          </span>
        </div>

        <div
          className="rounded-sm p-8"
          style={{
            border: "1px solid rgba(255,255,255,0.07)",
            background: "rgba(255,255,255,0.02)",
          }}
        >
          <h1
            className="text-lg font-semibold text-white mb-1"
          >
            Sign in to CRM
          </h1>
          <p
            className="text-sm mb-7"
            style={{ color: "rgba(255,255,255,0.35)" }}
          >
            Authorised access only.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: "rgba(255,255,255,0.5)" }}
              >
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full rounded-sm px-4 py-2.5 text-sm text-white outline-none transition-colors duration-150"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
                onFocus={(e) =>
                  (e.currentTarget.style.borderColor = "rgba(176,255,0,0.4)")
                }
                onBlur={(e) =>
                  (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")
                }
              />
            </div>

            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: "rgba(255,255,255,0.5)" }}
              >
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full rounded-sm px-4 py-2.5 text-sm text-white outline-none transition-colors duration-150"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
                onFocus={(e) =>
                  (e.currentTarget.style.borderColor = "rgba(176,255,0,0.4)")
                }
                onBlur={(e) =>
                  (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")
                }
              />
            </div>

            {error && (
              <p className="text-xs" style={{ color: "#ff6b6b" }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 text-sm font-semibold rounded-sm text-black transition-opacity duration-150 hover:opacity-80 disabled:opacity-50 mt-1"
              style={{ background: "#b0ff00" }}
            >
              {submitting ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
