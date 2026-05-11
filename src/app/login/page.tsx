"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Wordmark } from "@/components/brand/Wordmark";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const canSubmit = email.trim().length > 3 && password.length > 0;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    router.push("/");
  };

  return (
    <main className="min-h-dvh w-full flex items-stretch justify-center bg-app-bg">
      <div className="relative w-full max-w-[430px] min-h-dvh bg-app-bg flex flex-col overflow-hidden text-app-text">
        <button
          type="button"
          onClick={() => router.push("/onboarding")}
          aria-label="Back"
          className="absolute top-3.5 left-4 z-10 p-1.5 text-app-muted"
        >
          <svg width="10" height="16" viewBox="0 0 10 16" fill="none" aria-hidden>
            <path d="M8 1L1 8l7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <form
          onSubmit={submit}
          className="flex-1 flex flex-col gap-6 px-7 pt-16 pb-8"
        >
          <div className="flex flex-col gap-3">
            <Wordmark size={56} />
            <div className="font-mono text-[11px] tracking-[0.1em] uppercase text-app-accent">
              Sign in
            </div>
            <h1 className="font-serif text-[38px] leading-[1.05] tracking-tight text-app-text">
              Welcome back.
            </h1>
            <p className="text-[14px] text-app-muted leading-snug">
              Pick up where you left off — your connected platforms, drafts and history are all here.
            </p>
          </div>

          <div className="flex flex-col gap-2.5">
            <Field
              label="Email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={setEmail}
              placeholder="you@domain.com"
            />
            <Field
              label="Password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={setPassword}
              placeholder="••••••••"
              trailing={
                <button
                  type="button"
                  className="text-[12px] font-medium text-app-accent"
                  onClick={() => {}}
                >
                  Forgot?
                </button>
              }
            />
          </div>

          <div className="flex-1" />

          <div className="flex flex-col gap-2.5">
            <button
              type="submit"
              disabled={!canSubmit}
              className="py-[15px] px-4 rounded-[14px] bg-app-text text-app-bg text-[15px] font-semibold disabled:opacity-40"
            >
              Continue
            </button>

            <div className="flex items-center gap-3 py-1">
              <div className="flex-1 h-[0.5px] bg-app-line" />
              <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-app-muted">
                or
              </div>
              <div className="flex-1 h-[0.5px] bg-app-line" />
            </div>

            <button
              type="button"
              onClick={() => router.push("/")}
              className="py-[13px] px-4 rounded-[14px] bg-app-card border border-app-line text-[14px] font-semibold text-app-text flex items-center justify-center gap-2"
            >
              <AppleGlyph />
              Continue with Apple
            </button>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="py-[13px] px-4 rounded-[14px] bg-app-card border border-app-line text-[14px] font-semibold text-app-text flex items-center justify-center gap-2"
            >
              <GoogleGlyph />
              Continue with Google
            </button>

            <div className="text-[12px] text-app-muted text-center pt-1">
              New here?{" "}
              <button
                type="button"
                onClick={() => router.push("/onboarding")}
                className="text-app-accent font-medium"
              >
                Create an account
              </button>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  autoComplete,
  trailing,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: "text" | "email" | "password";
  placeholder?: string;
  autoComplete?: string;
  trailing?: React.ReactNode;
}) {
  return (
    <label className="bg-app-card border border-app-line rounded-[14px] px-4 py-2.5 flex flex-col gap-0.5">
      <div className="flex justify-between items-baseline">
        <span className="font-mono text-[10px] tracking-[0.12em] uppercase text-app-muted">
          {label}
        </span>
        {trailing}
      </div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="bg-transparent border-0 outline-none text-[16px] text-app-text placeholder:text-app-muted py-1"
      />
    </label>
  );
}

function AppleGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M11.2 8.5c0-1.7 1.4-2.5 1.5-2.6-.8-1.2-2.1-1.4-2.5-1.4-1.1-.1-2.1.6-2.6.6-.5 0-1.4-.6-2.3-.6-1.2 0-2.3.7-2.9 1.8C1.2 8.5 2.1 12 3.3 13.9c.6.9 1.3 2 2.3 2 .9 0 1.2-.6 2.3-.6s1.4.6 2.4.6c1 0 1.6-1 2.2-1.9.4-.6.7-1.2 1-1.9-2.4-1-2.3-3.6-2.3-3.6zM9.6 3.4c.5-.6.8-1.4.7-2.2-.7 0-1.5.4-2 1-.4.5-.8 1.3-.7 2.1.8.1 1.5-.3 2-.9z" />
    </svg>
  );
}

function GoogleGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden>
      <path
        fill="#4285F4"
        d="M17.6 9.2c0-.6-.1-1.2-.2-1.8H9v3.4h4.8c-.2 1.1-.8 2-1.8 2.7v2.2h2.9c1.7-1.5 2.7-3.8 2.7-6.5z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.4 0 4.5-.8 6-2.2l-2.9-2.2c-.8.5-1.8.9-3.1.9-2.4 0-4.4-1.6-5.1-3.8H.9v2.3C2.4 15.9 5.5 18 9 18z"
      />
      <path
        fill="#FBBC04"
        d="M3.9 10.7c-.2-.5-.3-1.1-.3-1.7s.1-1.2.3-1.7V5H.9C.3 6.2 0 7.6 0 9s.3 2.8.9 4l3-2.3z"
      />
      <path
        fill="#EA4335"
        d="M9 3.6c1.3 0 2.5.5 3.4 1.3l2.6-2.6C13.5.9 11.4 0 9 0 5.5 0 2.4 2.1.9 5l3 2.3C4.6 5.2 6.6 3.6 9 3.6z"
      />
    </svg>
  );
}
