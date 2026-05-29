"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useListingPipeline } from "@/lib/use-listing-pipeline";
import { useScoutPipeline } from "@/lib/use-scout-pipeline";
import { RootShell } from "@/components/layout/RootShell";
import type { Screen } from "@/components/layout/TabBar";
import { NavHeader } from "@/components/layout/NavHeader";
import { HomeScreen } from "@/components/screens/HomeScreen";
import { ConfirmScreen } from "@/components/screens/ConfirmScreen";
import { GeneratingScreen } from "@/components/screens/GeneratingScreen";
import { ResultsScreen } from "@/components/screens/ResultsScreen";
import { RecommendationScreen } from "@/components/screens/RecommendationScreen";
import { ScoutCheckingScreen } from "@/components/screens/ScoutCheckingScreen";
import { ScoutResultScreen } from "@/components/screens/ScoutResultScreen";
import { HistoryScreen } from "@/components/screens/HistoryScreen";
import { SettingsScreen } from "@/components/screens/SettingsScreen";
import type { AppMode } from "@/lib/types";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <App />
    </Suspense>
  );
}

const VALID_SCREENS: ReadonlySet<Screen> = new Set([
  "home",
  "confirm",
  "generating",
  "results",
  "recommendation",
  "scout-checking",
  "scout-result",
  "history",
  "settings",
]);

function App() {
  const router = useRouter();
  const search = useSearchParams();
  const initialScreen = (() => {
    const s = search.get("screen") as Screen | null;
    return s && VALID_SCREENS.has(s) ? s : "home";
  })();
  const [screen, setScreen] = useState<Screen>(initialScreen);
  const [mode, setMode] = useState<AppMode>("sell");

  // Clear ?screen=... from the URL once we've used it for initial routing.
  useEffect(() => {
    if (search.get("screen")) router.replace("/");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { state, actions } = useListingPipeline();
  const { state: scoutState, actions: scoutActions } = useScoutPipeline();

  const newListing = useCallback(() => {
    actions.reset();
    scoutActions.reset();
    setScreen("home");
  }, [actions, scoutActions]);

  const generate = useCallback(async () => {
    setScreen("generating");
    try {
      await actions.analyse();
      setScreen("results");
    } catch {
      setScreen("home");
    }
  }, [actions]);

  const runScout = useCallback(async () => {
    setScreen("scout-checking");
    try {
      await scoutActions.analyse();
      setScreen("scout-result");
    } catch {
      setScreen("home");
    }
  }, [scoutActions]);

  const graduateToSell = useCallback(async () => {
    // Reuse the photos already in the scout flow; hand them to the sell pipeline.
    actions.selectPhotos(scoutState.photos);
    setMode("sell");
    setScreen("generating");
    try {
      await actions.analyse();
      setScreen("results");
    } catch {
      setScreen("home");
    }
  }, [actions, scoutState.photos]);

  const scanNext = useCallback(() => {
    scoutActions.reset();
    setScreen("home");
  }, [scoutActions]);

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
        return { title: mode === "scout" ? "Scout find" : "New listing", back: () => setScreen("home") };
      case "generating":
        return { title: "" };
      case "scout-checking":
        return { title: "" };
      case "scout-result":
        return {
          title: "Scout",
          back: () => {
            scoutActions.reset();
            setScreen("home");
          },
          rightAction: (
            <button
              type="button"
              onClick={scanNext}
              className="text-app-accent text-[15px] font-medium"
            >
              New
            </button>
          ),
        };
      case "results":
        return {
          title: "",
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
    screen === "generating" || screen === "scout-checking" ? null : (
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
          mode={mode}
          onModeChange={setMode}
          onPhotosSelected={(p) => {
            if (mode === "scout") {
              scoutActions.selectPhotos(p);
            } else {
              actions.selectPhotos(p);
            }
            setScreen("confirm");
          }}
        />
      )}

      {screen === "confirm" && (
        <ConfirmScreen
          mode={mode}
          photos={mode === "scout" ? scoutState.photos : state.photos}
          onGenerate={mode === "scout" ? runScout : generate}
        />
      )}

      {screen === "generating" && <GeneratingScreen />}

      {screen === "scout-checking" && <ScoutCheckingScreen />}

      {screen === "scout-result" && scoutState.result && (
        <ScoutResultScreen
          result={scoutState.result}
          photos={scoutState.photos}
          cost={scoutState.cost}
          setCost={scoutActions.setCost}
          tagAdded={scoutState.tagAdded}
          checking={scoutState.rechecking}
          onAddTag={scoutActions.addTagPhoto}
          onListNow={graduateToSell}
          onScanNext={scanNext}
        />
      )}

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
