"use client";

import { useState, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Target, PiggyBank } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/providers/i18n-provider";

type TabValue = "goals" | "jars";

export function GoalsPageClient({
  initialTab,
  goalsContent,
  jarsContent,
}: {
  initialTab: TabValue;
  goalsContent: React.ReactNode;
  jarsContent: React.ReactNode;
}) {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<TabValue>(initialTab);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Sync URL with active tab without triggering navigation
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", activeTab);
    const newUrl = `${pathname}?${params.toString()}`;
    window.history.replaceState({}, "", newUrl);
  }, [activeTab, pathname, searchParams]);

  return (
    <>
      {/* ── Tab switcher ── */}
      <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
        <button
          onClick={() => setActiveTab("goals")}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold transition-all",
            activeTab === "goals"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700",
          )}
        >
          <Target className="h-4 w-4" />
          {t("goals.tabs.goals")}
        </button>
        <button
          onClick={() => setActiveTab("jars")}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold transition-all",
            activeTab === "jars"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700",
          )}
        >
          <PiggyBank className="h-4 w-4" />
          {t("goals.tabs.spending_jars")}
        </button>
      </div>

      {/* ── Content ── */}
      {activeTab === "jars" ? jarsContent : goalsContent}
    </>
  );
}
