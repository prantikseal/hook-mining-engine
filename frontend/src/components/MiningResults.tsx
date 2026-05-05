"use client";

import { Button } from "@/components/ui/button";
import { ScriptCard } from "./ScriptCard";
import { formatEngagement } from "@/lib/utils";
import type { MineHooksResponse, HookRecord } from "@/lib/types";

interface MiningResultsProps {
  results: MineHooksResponse;
  onDismiss: () => void;
  onRegenerate?: (hookId: string) => void;
}

export function MiningResults({ results, onDismiss, onRegenerate }: MiningResultsProps) {
  // Build a lookup for hooks by id
  const hooksById: Record<string, HookRecord> = {};
  for (const hook of results.hooks) {
    if (hook.id) hooksById[hook.id] = hook;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">
            Mining Complete &mdash; {results.hooks_mined} hooks found
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {results.generated_scripts.length} reel scripts auto-generated for top hooks
          </p>
        </div>
        <Button variant="outline" onClick={onDismiss}>
          View All Hooks
        </Button>
      </div>

      {/* Trending Audio */}
      {results.trending_audio.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wide">
            Trending Audio
          </h3>
          <div className="flex flex-wrap gap-2">
            {results.trending_audio.map((audio) => (
              <div
                key={audio.audio_track_name}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-50 border border-violet-200 text-sm"
              >
                <svg className="h-3.5 w-3.5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z"
                  />
                </svg>
                <span className="font-medium text-violet-800 truncate max-w-[200px]">
                  {audio.audio_track_name}
                </span>
                <span className="text-violet-600 font-mono text-xs">
                  {audio.count}x &middot; {formatEngagement(Math.round(audio.avg_engagement))} avg
                </span>
                {audio.audio_url && (
                  <a
                    href={audio.audio_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-violet-500 hover:text-violet-700"
                    title="Open audio"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Generated Scripts */}
      {results.generated_scripts.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wide">
            Top {results.generated_scripts.length} Generated Scripts
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {results.generated_scripts.map((script, i) => (
              <ScriptCard
                key={`${script.hook_id}-${i}`}
                script={script}
                hook={hooksById[script.hook_id]}
                onRegenerate={onRegenerate}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
