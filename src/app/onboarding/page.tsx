"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { platformMetadata, PLATFORM_IDS } from "@/platforms";
import { Wordmark } from "@/components/brand/Wordmark";

type Step = 0 | 1 | 2 | 3 | 4 | 5;
const TOTAL: 6 = 6;

export default function OnboardingPage() {
  return (
    <Suspense fallback={null}>
      <OnboardingFlow />
    </Suspense>
  );
}

function OnboardingFlow() {
  const router = useRouter();
  const search = useSearchParams();
  const tourMode = search.get("from") === "tour";

  const [step, setStep] = useState<Step>(tourMode ? 3 : 0);

  const next = () => setStep((s) => Math.min(s + 1, TOTAL - 1) as Step);
  const back = () => setStep((s) => Math.max(s - 1, 0) as Step);
  const exit = () => router.push(tourMode ? "/?screen=settings" : "/");

  return (
    <main className="min-h-dvh w-full flex items-stretch justify-center bg-app-bg">
      <div className="relative w-full max-w-[430px] min-h-dvh bg-app-bg flex flex-col overflow-hidden text-app-text">
        {step > 0 && step < 3 && (
          <button
            type="button"
            onClick={back}
            aria-label="Back"
            className="absolute top-3.5 left-4 z-10 p-1.5 text-app-muted"
          >
            <svg width="10" height="16" viewBox="0 0 10 16" fill="none" aria-hidden>
              <path d="M8 1L1 8l7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}

        {step === 0 && <Welcome onNext={next} onSignIn={() => router.push("/login")} />}
        {step === 1 && <Connect onNext={next} />}
        {step === 2 && <Permissions onNext={next} />}
        {step >= 3 && step <= 5 && (
          <Tour
            step={(step - 3) as 0 | 1 | 2}
            tourMode={tourMode}
            onNext={() => (step === 5 ? exit() : next())}
            onSkip={exit}
          />
        )}
      </div>
    </main>
  );
}

function Welcome({ onNext, onSignIn }: { onNext: () => void; onSignIn: () => void }) {
  return (
    <div className="flex-1 flex flex-col justify-between px-8 pt-10 pb-8">
      <div className="flex flex-col items-center gap-4 text-center mt-16">
        <Wordmark size={96} className="!tracking-[-0.04em]" />
        <p className="text-[17px] text-app-muted leading-snug max-w-[260px]">
          Sell smarter. Snap a few photos, post to the right platform, get paid more.
        </p>
      </div>
      <div className="flex flex-col gap-2.5">
        <button
          type="button"
          onClick={onNext}
          className="py-[15px] px-4 rounded-[14px] bg-app-text text-app-bg text-[15px] font-semibold"
        >
          Get started
        </button>
        <div className="text-[12px] text-app-muted text-center">
          Already have an account?{" "}
          <button
            type="button"
            onClick={onSignIn}
            className="text-app-accent font-medium"
          >
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
}

function Connect({ onNext }: { onNext: () => void }) {
  const [connected, setConnected] = useState<Record<string, boolean>>({
    vinted: true,
    depop: false,
    ebay: true,
  });
  const anyOn = Object.values(connected).some(Boolean);

  return (
    <div className="flex-1 flex flex-col gap-6 px-7 pt-5 pb-8">
      <StepHeader kicker="Step 1 of 3" title="Where do you sell?">
        We&apos;ll write listings for each platform you connect. You can change this later.
      </StepHeader>

      <div className="flex flex-col gap-2.5">
        {PLATFORM_IDS.map((id) => {
          const p = platformMetadata[id];
          const on = connected[id];
          return (
            <button
              key={id}
              type="button"
              onClick={() => setConnected((c) => ({ ...c, [id]: !c[id] }))}
              className="bg-app-card rounded-[14px] py-3.5 px-4 flex items-center gap-3.5 text-left transition-colors"
              style={{ border: on ? `1.5px solid ${p.color}` : "0.5px solid var(--color-app-line)" }}
            >
              <div
                className="w-[38px] h-[38px] rounded-[10px] flex items-center justify-center text-white font-bold text-[17px] flex-shrink-0"
                style={{ background: p.color }}
              >
                {p.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[15px] font-semibold text-app-text">{p.name}</div>
                <div className="text-[12px] text-app-muted">{p.audience}</div>
              </div>
              <Toggle on={on} tint={p.color} />
            </button>
          );
        })}
      </div>

      <div className="flex-1" />
      <button
        type="button"
        onClick={onNext}
        disabled={!anyOn}
        className="py-[15px] px-4 rounded-[14px] bg-app-text text-app-bg text-[15px] font-semibold disabled:opacity-40"
      >
        Continue
      </button>
    </div>
  );
}

function Permissions({ onNext }: { onNext: () => void }) {
  const items = [
    {
      id: "photos",
      label: "Photo Library",
      desc: "So we can read your listing photos.",
      icon: (
        <svg width="20" height="20" viewBox="0 0 22 22" fill="none" aria-hidden>
          <rect x="3.5" y="5.5" width="15" height="13" rx="2.5" stroke="currentColor" strokeWidth="1.7" />
          <path d="M3.5 14l4-3.5 4 3 3-2 4 3.5" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
          <circle cx="14" cy="9.5" r="1.3" fill="currentColor" />
        </svg>
      ),
    },
    {
      id: "camera",
      label: "Camera",
      desc: "Snap photos without leaving the app.",
      icon: (
        <svg width="20" height="20" viewBox="0 0 22 22" fill="none" aria-hidden>
          <rect x="2.5" y="5" width="17" height="13" rx="3" stroke="currentColor" strokeWidth="1.7" />
          <circle cx="11" cy="11.5" r="3.3" stroke="currentColor" strokeWidth="1.7" />
          <path d="M8 5l1.5-2h3L14 5" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      id: "notify",
      label: "Notifications",
      desc: "We'll ping you when an item sells.",
      icon: (
        <svg width="20" height="20" viewBox="0 0 22 22" fill="none" aria-hidden>
          <path d="M5 9a6 6 0 0 1 12 0v3l1.5 3h-15L5 12V9z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
          <path d="M9 18a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      ),
    },
  ] as const;

  const [perms, setPerms] = useState<Record<string, "allow" | "skip" | null>>({
    photos: null,
    camera: null,
    notify: null,
  });
  const allHandled = items.every((i) => perms[i.id] !== null);

  return (
    <div className="flex-1 flex flex-col gap-6 px-7 pt-5 pb-8">
      <StepHeader kicker="Step 2 of 3" title="A few permissions.">
        wattle only uses these for the listing flow. You can change them in Settings anytime.
      </StepHeader>

      <div className="flex flex-col gap-2.5">
        {items.map((it) => {
          const state = perms[it.id];
          return (
            <div
              key={it.id}
              className="bg-app-card rounded-[14px] border border-app-line py-3.5 px-4 flex items-center gap-3.5"
            >
              <div className="w-[38px] h-[38px] rounded-[10px] bg-app-subtle text-app-accent flex items-center justify-center flex-shrink-0">
                {it.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-semibold text-app-text">{it.label}</div>
                <div className="text-[12px] text-app-muted leading-snug">{it.desc}</div>
              </div>
              {state === null && (
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPerms((p) => ({ ...p, [it.id]: "skip" }))}
                    className="py-1.5 px-1 text-[12px] text-app-muted"
                  >
                    Skip
                  </button>
                  <button
                    type="button"
                    onClick={() => setPerms((p) => ({ ...p, [it.id]: "allow" }))}
                    className="py-[7px] px-3 rounded-lg bg-app-accent text-white text-[12px] font-semibold"
                  >
                    Allow
                  </button>
                </div>
              )}
              {state === "allow" && (
                <div
                  className="w-[26px] h-[26px] rounded-full flex items-center justify-center text-white"
                  style={{ background: "var(--color-brand-eucalypt)" }}
                  aria-label="Allowed"
                >
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden>
                    <path d="M3 8.5l3 3 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
              {state === "skip" && <div className="text-[11px] text-app-muted">Skipped</div>}
            </div>
          );
        })}
      </div>

      <div className="flex-1" />
      <button
        type="button"
        onClick={onNext}
        disabled={!allHandled}
        className="py-[15px] px-4 rounded-[14px] bg-app-text text-app-bg text-[15px] font-semibold disabled:opacity-40"
      >
        Continue
      </button>
    </div>
  );
}

function Tour({
  step,
  tourMode,
  onNext,
  onSkip,
}: {
  step: 0 | 1 | 2;
  tourMode: boolean;
  onNext: () => void;
  onSkip: () => void;
}) {
  const pages = [
    {
      kicker: "How it works · 1 of 3",
      title: "Snap a few photos.",
      desc: "Front, back, the tag — that's usually all we need. wattle reads the label, size and condition for you.",
      illo: <MockPhotoGrid />,
    },
    {
      kicker: "How it works · 2 of 3",
      title: "We write the listing.",
      desc: "Title, description, hashtags — tuned for each platform's tone. Edit anything you want before posting.",
      illo: <MockCaptionStack />,
    },
    {
      kicker: "How it works · 3 of 3",
      title: "Pick where to sell.",
      desc: "wattle scans live comps and tells you which platform pays the most after fees. One tap to open it in the right app.",
      illo: <MockRecCard />,
    },
  ] as const;
  const p = pages[step];
  const isLast = step === 2;

  return (
    <div className="flex-1 flex flex-col gap-5 px-7 pt-5 pb-7">
      <div className="flex justify-between items-center">
        <div className="flex gap-1">
          {pages.map((_, i) => (
            <div
              key={i}
              className="w-[22px] h-[3px] rounded-sm transition-colors"
              style={{ background: i <= step ? "var(--color-app-accent)" : "var(--color-app-line)" }}
            />
          ))}
        </div>
        <button type="button" onClick={onSkip} className="text-[13px] text-app-muted">
          Skip tour
        </button>
      </div>

      <div
        className="flex-1 flex items-center justify-center rounded-[18px] p-5 min-h-[240px] bg-app-subtle"
      >
        {p.illo}
      </div>

      <div className="flex flex-col gap-2">
        <Kicker>{p.kicker}</Kicker>
        <h1 className="font-serif text-[32px] leading-[1.05] tracking-tight text-app-text">
          {p.title}
        </h1>
        <p className="text-[14px] text-app-muted leading-snug">{p.desc}</p>
      </div>

      <button
        type="button"
        onClick={onNext}
        className="py-[15px] px-4 rounded-[14px] bg-app-text text-app-bg text-[15px] font-semibold flex items-center justify-center gap-2"
      >
        {isLast ? (tourMode ? "Done" : "Start your first listing") : "Next"}
        {!(isLast && tourMode) && (
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>
    </div>
  );
}

function StepHeader({
  kicker,
  title,
  children,
}: {
  kicker: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Kicker>{kicker}</Kicker>
      <h1 className="font-serif text-[38px] leading-[1.05] tracking-tight text-app-text">
        {title}
      </h1>
      <p className="text-[14px] text-app-muted leading-snug">{children}</p>
    </div>
  );
}

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-mono text-[11px] tracking-[0.1em] uppercase text-app-accent">
      {children}
    </div>
  );
}

function Toggle({ on, tint }: { on: boolean; tint: string }) {
  return (
    <div
      className="w-11 h-[26px] rounded-[13px] relative transition-colors flex-shrink-0"
      style={{
        background: on ? tint : "var(--color-app-subtle)",
        border: `0.5px solid ${on ? tint : "var(--color-app-line)"}`,
      }}
      aria-hidden
    >
      <div
        className="absolute top-[2px] w-5 h-5 rounded-full bg-white transition-[left] shadow"
        style={{ left: on ? 20 : 2, boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }}
      />
    </div>
  );
}

function MockPhotoGrid() {
  const tints = ["#c9c1b1", "#8a9684", "#a89478", "#6f7878"];
  const labels = ["FRONT", "BACK", "TAG", "DETAIL"];
  return (
    <div
      className="grid grid-cols-2 gap-2 p-2 rounded-[18px] border border-app-line bg-app-card"
      style={{ width: 240, aspectRatio: "1" }}
    >
      {tints.map((t, i) => (
        <div
          key={i}
          className="rounded-[10px] relative"
          style={{
            background: t,
            backgroundImage:
              "repeating-linear-gradient(45deg, rgba(255,255,255,0.06) 0 4px, transparent 4px 8px)",
          }}
        >
          <div className="absolute bottom-1.5 left-1.5 font-mono text-[8px] font-semibold tracking-[0.06em] bg-white/85 text-app-text px-[5px] py-[2px] rounded-sm">
            {labels[i]}
          </div>
        </div>
      ))}
    </div>
  );
}

function MockCaptionStack() {
  const lines = [
    { plat: "Vinted", color: "#09b1ba", text: "Vintage Carhartt Detroit jacket — brown duck canvas, size M." },
    { plat: "Depop", color: "#f00d2d", text: "Carhartt detroit jacket ✨ brown duck, distressed in the best way." },
    { plat: "eBay", color: "#0064d2", text: "Carhartt Detroit Jacket — Brown Duck Canvas — M, Excellent." },
  ];
  return (
    <div className="flex flex-col gap-2" style={{ width: 260 }}>
      {lines.map((l, i) => (
        <div
          key={i}
          className="bg-app-card rounded-xl px-3 py-2.5 border border-app-line flex gap-2.5 items-start"
          style={{ marginLeft: i * 8 }}
        >
          <div
            className="text-[9px] font-bold text-white px-1.5 py-[3px] rounded-sm tracking-[0.06em] flex-shrink-0"
            style={{ background: l.color }}
          >
            {l.plat.toUpperCase()}
          </div>
          <div className="text-[11px] text-app-text leading-snug">{l.text}</div>
        </div>
      ))}
    </div>
  );
}

function MockRecCard() {
  return (
    <div className="flex flex-col gap-2" style={{ width: 240 }}>
      <div
        className="relative overflow-hidden rounded-2xl p-4 text-white"
        style={{ background: "#0064d2" }}
      >
        <div
          className="absolute -top-[30px] -right-[30px] w-[90px] h-[90px] rounded-full"
          style={{ background: "rgba(255,255,255,0.1)" }}
        />
        <div className="relative">
          <div className="flex justify-between items-center">
            <div className="font-mono text-[9px] tracking-[0.1em] opacity-85 uppercase">
              Best payout
            </div>
            <div
              className="text-[8px] font-bold px-1.5 py-[2px] rounded-sm tracking-[0.06em]"
              style={{ background: "rgba(255,255,255,0.18)" }}
            >
              ★ BEST
            </div>
          </div>
          <div className="text-[30px] font-bold tracking-tight mt-1">£42</div>
          <div className="text-[10px] opacity-85">on eBay · after fees</div>
        </div>
      </div>
      {[
        { name: "Vinted", color: "#09b1ba", net: 38 },
        { name: "Depop", color: "#f00d2d", net: 38 },
      ].map((p) => (
        <div
          key={p.name}
          className="bg-app-card rounded-[10px] py-2 px-3 border border-app-line flex items-center gap-2.5"
        >
          <div className="w-1 h-[22px] rounded-[2px]" style={{ background: p.color }} />
          <div className="flex-1 text-[12px] font-semibold text-app-text">{p.name}</div>
          <div className="text-[13px] font-semibold text-app-text">£{p.net}</div>
        </div>
      ))}
    </div>
  );
}
