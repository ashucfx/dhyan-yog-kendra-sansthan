"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { validateEmail } from "@/lib/customer-validation";

function getErrorMessage(code: string) {
  if (code === "unauthorized") {
    return "This account does not have admin access.";
  }
  if (code === "forbidden") {
    return "Your role does not permit this admin action.";
  }
  if (code === "config") {
    return "Admin RBAC is not configured correctly on the server.";
  }
  if (code === "legacy") {
    return "The old shared-password admin login is disabled. Use your admin email and password.";
  }
  return "";
}

export function AdminSignInClient({
  redirectTo,
  initialError
}: {
  redirectTo?: string;
  initialError?: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(getErrorMessage(initialError ?? ""));

  async function handleSubmit() {
    if (!validateEmail(email)) {
      setMessage("Enter a valid admin email address.");
      return;
    }

    if (!password.trim()) {
      setMessage("Password is required.");
      return;
    }

    setBusy(true);
    setMessage("");

    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) {
        throw error;
      }

      const sessionResponse = await fetch("/api/admin/session", { cache: "no-store" });
      const sessionResult = (await sessionResponse.json()) as { message?: string };
      if (!sessionResponse.ok) {
        await supabase.auth.signOut();
        throw new Error(sessionResult.message || "This account is not authorized for admin access.");
      }

      router.push(redirectTo?.startsWith("/admin") ? redirectTo : "/admin");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to sign in.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-form-grid admin-auth-form">
      <input
        type="email"
        placeholder="Admin email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />
      {message ? <p className="form-status form-status-error">{message}</p> : null}
      <button className="button" type="button" disabled={busy} onClick={() => void handleSubmit()}>
        {busy ? "Signing in..." : "Open admin dashboard"}
      </button>
    </div>
  );
}
