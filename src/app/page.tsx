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
        return { title: "wattle", serif: true, large: true };
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
        return { title: "Your listings", large: true };
      case "settings":
        return { title: "Settings", large: true };
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
    <RootShell
      screen={screen}
      onNav={(s) => setScreen(s)}
      hideTabBar={screen === "generating"}
      header={header}
    >
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
          onNewListing={newListing}
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
