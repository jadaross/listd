"use client";

import { useCallback, useState } from "react";
import { useListingPipeline } from "@/lib/use-listing-pipeline";
import { RootShell } from "@/components/layout/RootShell";
import type { Screen } from "@/components/layout/TabBar";
import { NavHeader } from "@/components/layout/NavHeader";
import { HomeScreen } from "@/components/screens/HomeScreen";
import { ConfirmScreen } from "@/components/screens/ConfirmScreen";
import { GeneratingScreen } from "@/components/screens/GeneratingScreen";
import { ResultsScreen } from "@/components/screens/ResultsScreen";
import { RecommendationScreen } from "@/components/screens/RecommendationScreen";
import { HistoryScreen } from "@/components/screens/HistoryScreen";
import { SettingsScreen } from "@/components/screens/SettingsScreen";

export default function Page() {
  const [screen, setScreen] = useState<Screen>("home");
  const { state, actions } = useListingPipeline();

  const newListing = useCallback(() => {
    actions.reset();
    setScreen("home");
  }, [actions]);

  const generate = useCallback(async () => {
    setScreen("generating");
    try {
      await actions.analyse();
      setScreen("results");
    } catch {
      setScreen("home");
    }
  }, [actions]);

  const cogButton = (
    <button
      type="button"
      onClick={() => setScreen("settings")}
      aria-label="Settings"
      className="text-app-text/80 hover:text-app-text"
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7" />
        <path
          d="M19.4 14.5a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 0 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 0 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 0 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 0 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9v0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );

  const headerCfg: {
    title: string;
    serif?: boolean;
    large?: boolean;
    back?: () => void;
    backLabel?: string;
    rightAction?: React.ReactNode;
  } = (() => {
    switch (screen) {
      case "home":
        return { title: "", rightAction: cogButton };
      case "confirm":
        return { title: "New listing", back: () => setScreen("home") };
      case "generating":
        return { title: "" };
      case "results":
        return {
          title: "Listings",
          back: () => setScreen("home"),
          rightAction: (
            <button
              type="button"
              onClick={newListing}
              className="text-app-accent text-[15px] font-medium"
            >
              New
            </button>
          ),
        };
      case "recommendation":
        return { title: "Where to post", back: () => setScreen("results"), backLabel: "Listing" };
      case "history":
        return { title: "Your listings", large: true, back: () => setScreen("home") };
      case "settings":
        return { title: "Settings", large: true, back: () => setScreen("home") };
    }
  })();

  const header =
    screen === "generating" ? null : (
      <NavHeader
        title={headerCfg.title}
        serif={headerCfg.serif}
        large={headerCfg.large}
        back={headerCfg.back}
        backLabel={headerCfg.backLabel}
        right={headerCfg.rightAction}
      />
    );

  return (
    <RootShell screen={screen} header={header}>
      {screen === "home" && (
        <HomeScreen
          onPhotosSelected={(p) => {
            actions.selectPhotos(p);
            setScreen("confirm");
          }}
        />
      )}

      {screen === "confirm" && (
        <ConfirmScreen photos={state.photos} onGenerate={generate} />
      )}

      {screen === "generating" && <GeneratingScreen />}

      {screen === "results" && (
        <ResultsScreen
          state={state}
          actions={actions}
          onSeeRecommendation={() => setScreen("recommendation")}
        />
      )}

      {screen === "recommendation" && (
        <RecommendationScreen
          insights={state.marketInsights}
          onBack={() => setScreen("results")}
        />
      )}

      {screen === "history" && <HistoryScreen />}
      {screen === "settings" && <SettingsScreen />}
    </RootShell>
  );
}
