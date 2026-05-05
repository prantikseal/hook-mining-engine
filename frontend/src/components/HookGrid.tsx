"use client";

import { HookCard } from "./HookCard";
import { Skeleton } from "@/components/ui/skeleton";
import type { GeneratedScriptRecord, HookRecord } from "@/lib/types";

interface HookGridProps {
  hooks: HookRecord[];
  scripts: Record<string, GeneratedScriptRecord[]>;
  loading: boolean;
  onGenerate: (hook: HookRecord) => void;
}

function HookCardSkeleton() {
  return (
    <div className="rounded-xl border p-6 flex flex-col gap-4">
      <div className="flex justify-between">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-5 w-14" />
      </div>
      <Skeleton className="h-5 w-full" />
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-9 w-full mt-auto" />
    </div>
  );
}

export function HookGrid({ hooks, scripts, loading, onGenerate }: HookGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <HookCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (hooks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <svg className="h-8 w-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <h3 className="font-semibold text-lg mb-1">No hooks yet</h3>
        <p className="text-muted-foreground text-sm max-w-sm">
          Click &quot;Mine New Hooks&quot; to scrape viral content from TikTok or Instagram and discover winning hook patterns.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {hooks.map((hook) => (
        <HookCard
          key={hook.id}
          hook={hook}
          scripts={hook.id ? scripts[hook.id] : undefined}
          onGenerate={onGenerate}
        />
      ))}
    </div>
  );
}
