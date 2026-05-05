"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { HookGrid } from "@/components/HookGrid";
import { DraftModal } from "@/components/DraftModal";
import { MineButton } from "@/components/MineButton";
import { MiningResults } from "@/components/MiningResults";
import { CronStatus } from "@/components/CronStatus";
import { fetchHooks, fetchScripts } from "@/lib/api";
import { PATTERN_TYPES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { GeneratedScriptRecord, HookRecord, MineHooksResponse } from "@/lib/types";

type SortBy = "engagement" | "date";
type PlatformFilter = "all" | "tiktok" | "instagram";
type ScriptFilter = "all" | "has_script" | "no_script";

export default function DashboardPage() {
  const [hooks, setHooks] = useState<HookRecord[]>([]);
  const [scripts, setScripts] = useState<Record<string, GeneratedScriptRecord[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortBy>("engagement");
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>("all");
  const [scriptFilter, setScriptFilter] = useState<ScriptFilter>("all");
  const [selectedHook, setSelectedHook] = useState<HookRecord | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [miningResults, setMiningResults] = useState<MineHooksResponse | null>(null);

  const loadHooks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [data, allScripts] = await Promise.all([
        fetchHooks({ pattern_type: filter ?? undefined, limit: 200 }),
        fetchScripts(),
      ]);
      setHooks(data);
      // Group scripts by hook_id (most recent first, already sorted by API)
      const grouped: Record<string, GeneratedScriptRecord[]> = {};
      for (const s of allScripts) {
        if (!grouped[s.hook_id]) grouped[s.hook_id] = [];
        grouped[s.hook_id].push(s);
      }
      setScripts(grouped);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load hooks");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadHooks();
  }, [loadHooks]);

  const filteredHooks = useMemo(() => {
    let result = [...hooks];

    // Platform filter
    if (platformFilter !== "all") {
      result = result.filter((h) => h.source_platform === platformFilter);
    }

    // Script ready filter
    if (scriptFilter === "has_script") {
      result = result.filter((h) => h.id && scripts[h.id]?.length > 0);
    } else if (scriptFilter === "no_script") {
      result = result.filter((h) => !h.id || !scripts[h.id]?.length);
    }

    // Sort
    if (sortBy === "date") {
      result.sort((a, b) => {
        const da = a.created_at ? new Date(a.created_at).getTime() : 0;
        const db = b.created_at ? new Date(b.created_at).getTime() : 0;
        return db - da;
      });
    } else {
      result.sort((a, b) => b.engagement_score - a.engagement_score);
    }

    return result;
  }, [hooks, scripts, platformFilter, scriptFilter, sortBy]);

  function handleGenerate(hook: HookRecord) {
    setSelectedHook(hook);
    setModalOpen(true);
  }

  function handleMineComplete(results?: MineHooksResponse) {
    if (results && results.hooks_mined > 0) {
      setMiningResults(results);
    }
    loadHooks();
  }

  function handleDismissResults() {
    setMiningResults(null);
  }

  function handleRegenerate(hookId: string) {
    const hook = [...(miningResults?.hooks ?? []), ...hooks].find((h) => h.id === hookId);
    if (hook) {
      setSelectedHook(hook);
      setModalOpen(true);
    }
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              <span className="text-primary">Pixii</span> Hook Mining Engine
            </h1>
            <div className="mt-1">
              <CronStatus />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/settings"
              className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              title="Mining Settings"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </a>
            <MineButton onComplete={handleMineComplete} />
          </div>
        </div>
      </header>

      {/* Filter & Sort Bar — hidden when showing mining results */}
      {!miningResults && (
        <div className="border-b bg-card">
          <div className="max-w-7xl mx-auto px-6 py-3 space-y-3">
            {/* Pattern type pills */}
            <div className="flex gap-2 overflow-x-auto">
              <button
                onClick={() => setFilter(null)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap",
                  filter === null
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-accent"
                )}
              >
                All
              </button>
              {PATTERN_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => setFilter(type)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap",
                    filter === type
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-accent"
                  )}
                >
                  {type}
                </button>
              ))}
            </div>

            {/* Sort + filters row */}
            <div className="flex flex-wrap items-center gap-3 text-sm">
              {/* Sort */}
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                </svg>
                <span>Sort:</span>
              </div>
              <button
                onClick={() => setSortBy("engagement")}
                className={cn(
                  "px-2.5 py-1 rounded-md font-medium transition-colors",
                  sortBy === "engagement"
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                Engagement
              </button>
              <button
                onClick={() => setSortBy("date")}
                className={cn(
                  "px-2.5 py-1 rounded-md font-medium transition-colors",
                  sortBy === "date"
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                Newest
              </button>

              <div className="w-px h-5 bg-border" />

              {/* Platform filter */}
              <button
                onClick={() => setPlatformFilter("all")}
                className={cn(
                  "px-2.5 py-1 rounded-md font-medium transition-colors",
                  platformFilter === "all"
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                All Platforms
              </button>
              <button
                onClick={() => setPlatformFilter("tiktok")}
                className={cn(
                  "px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1",
                  platformFilter === "tiktok"
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.75a8.18 8.18 0 0 0 4.76 1.52V6.82a4.83 4.83 0 0 1-1-.13z" />
                </svg>
                TikTok
              </button>
              <button
                onClick={() => setPlatformFilter("instagram")}
                className={cn(
                  "px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1",
                  platformFilter === "instagram"
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
                </svg>
                Instagram
              </button>

              <div className="w-px h-5 bg-border" />

              {/* Script ready filter */}
              <button
                onClick={() => setScriptFilter("all")}
                className={cn(
                  "px-2.5 py-1 rounded-md font-medium transition-colors",
                  scriptFilter === "all"
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                All Scripts
              </button>
              <button
                onClick={() => setScriptFilter("has_script")}
                className={cn(
                  "px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1",
                  scriptFilter === "has_script"
                    ? "bg-green-100 text-green-700"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Script Ready
              </button>
              <button
                onClick={() => setScriptFilter("no_script")}
                className={cn(
                  "px-2.5 py-1 rounded-md font-medium transition-colors",
                  scriptFilter === "no_script"
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                No Script
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
        {miningResults ? (
          <MiningResults
            results={miningResults}
            onDismiss={handleDismissResults}
            onRegenerate={handleRegenerate}
          />
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-destructive mb-4">{error}</p>
            <button
              onClick={loadHooks}
              className="text-sm text-primary underline hover:no-underline"
            >
              Try again
            </button>
          </div>
        ) : (
          <HookGrid hooks={filteredHooks} scripts={scripts} loading={loading} onGenerate={handleGenerate} />
        )}
      </main>

      {/* Draft Modal */}
      <DraftModal
        hook={selectedHook}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
