"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PatternBadge } from "./PatternBadge";
import { HookDetailModal } from "./HookDetailModal";
import { formatEngagement } from "@/lib/utils";
import type { GeneratedScriptRecord, HookRecord } from "@/lib/types";

interface HookCardProps {
  hook: HookRecord;
  scripts?: GeneratedScriptRecord[];
  onGenerate: (hook: HookRecord) => void;
}

function PlatformIcon({ platform }: { platform: string }) {
  if (platform === "tiktok") {
    return (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.75a8.18 8.18 0 0 0 4.76 1.52V6.82a4.83 4.83 0 0 1-1-.13z" />
      </svg>
    );
  }
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
    </svg>
  );
}

export function HookCard({ hook, scripts, onGenerate }: HookCardProps) {
  const [detailOpen, setDetailOpen] = useState(false);
  const latestScript = scripts?.[0];

  return (
    <>
      <Card className="group hover:shadow-md transition-shadow duration-200">
        <CardContent className="p-0 flex flex-col">
          {/* Thumbnail */}
          {hook.thumbnail_url && (
            <div
              className="relative aspect-video overflow-hidden rounded-t-xl cursor-pointer"
              onClick={() => setDetailOpen(true)}
            >
              <img
                src={hook.thumbnail_url}
                alt=""
                className="w-full h-full object-cover"
                loading="lazy"
              />
              {hook.video_url && (
                <a
                  href={hook.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute top-2 right-2 p-1.5 rounded-md bg-black/50 text-white hover:bg-black/70 transition-colors"
                  title="Open video"
                  onClick={(e) => e.stopPropagation()}
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )}
              {latestScript && (
                <div className="absolute top-2 left-2">
                  <Badge className="bg-green-600 text-white text-[10px]">Script Ready</Badge>
                </div>
              )}
            </div>
          )}

          <div className="p-5 flex flex-col gap-3 flex-1">
            <div className="flex items-center justify-between gap-2">
              <PatternBadge patternType={hook.pattern_type} />
              <div className="flex items-center gap-3 text-muted-foreground text-sm">
                {hook.view_count > 0 && (
                  <span className="flex items-center gap-1 text-xs">
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    {formatEngagement(hook.view_count)}
                  </span>
                )}
                <div className="flex items-center gap-1.5">
                  <PlatformIcon platform={hook.source_platform} />
                  <span className="font-mono font-semibold">
                    {formatEngagement(hook.engagement_score)}
                  </span>
                </div>
              </div>
            </div>

            <p className="font-semibold text-base leading-snug line-clamp-3">
              {hook.hook_text}
            </p>

            {hook.explanation && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {hook.explanation}
              </p>
            )}

            {/* Transcript snippet */}
            {hook.transcript && (
              <div className="text-xs bg-muted rounded-md px-2.5 py-1.5">
                <span className="font-medium text-muted-foreground">Transcript: </span>
                <span className="text-foreground">
                  {hook.transcript.length > 80
                    ? hook.transcript.slice(0, 80) + "..."
                    : hook.transcript}
                </span>
              </div>
            )}

            {hook.audio_track_name && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" />
                </svg>
                <span className="truncate">{hook.audio_track_name}</span>
              </div>
            )}

            {hook.video_url && (
              <a
                href={hook.video_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-primary hover:underline"
              >
                <PlatformIcon platform={hook.source_platform} />
                <span>Watch on {hook.source_platform === "tiktok" ? "TikTok" : "Instagram"}</span>
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}

            <div className="flex gap-2 mt-auto">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setDetailOpen(true)}
              >
                View Details
              </Button>
              <Button
                size="sm"
                className="flex-1"
                onClick={() => onGenerate(hook)}
              >
                {latestScript ? "Regenerate" : "Generate"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <HookDetailModal
        hook={hook}
        scripts={scripts}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        onGenerate={onGenerate}
      />
    </>
  );
}
