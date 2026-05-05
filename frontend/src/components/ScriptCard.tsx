"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PatternBadge } from "./PatternBadge";
import { formatEngagement } from "@/lib/utils";
import type { GenerateScriptResponse, HookRecord } from "@/lib/types";

interface ScriptCardProps {
  script: GenerateScriptResponse;
  hook?: HookRecord;
  onRegenerate?: (hookId: string) => void;
}

export function ScriptCard({ script, hook, onRegenerate }: ScriptCardProps) {
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedCaption, setCopiedCaption] = useState(false);
  const { reel_script, seo_caption } = script;

  async function copyScript() {
    const text = [
      `HOOK (0-3s): "${reel_script.hook_line}"`,
      `TEXT OVERLAY: "${reel_script.hook_text_overlay}"`,
      "",
      `BODY (3-15s):`,
      ...reel_script.body_lines.map((l, i) => `  ${i + 1}. ${l}`),
      `VISUAL: ${reel_script.body_visual_direction}`,
      "",
      `CTA (15-20s): "${reel_script.cta_line}"`,
      reel_script.audio_recommendation ? `\nAUDIO: ${reel_script.audio_recommendation}` : "",
    ]
      .filter(Boolean)
      .join("\n");
    await navigator.clipboard.writeText(text);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  }

  async function copyCaption() {
    const text = `${seo_caption.caption_text}\n\n${seo_caption.hashtags.map((h) => `#${h}`).join(" ")}`;
    await navigator.clipboard.writeText(text);
    setCopiedCaption(true);
    setTimeout(() => setCopiedCaption(false), 2000);
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* Source Hook Header */}
        {hook && (
          <div className="flex items-start gap-3 p-4 bg-muted/50 border-b">
            {hook.thumbnail_url && (
              <img
                src={hook.thumbnail_url}
                alt=""
                className="w-16 h-24 object-cover rounded-md flex-shrink-0"
                loading="lazy"
              />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <PatternBadge patternType={hook.pattern_type} />
                <span className="text-xs text-muted-foreground font-mono">
                  {formatEngagement(hook.engagement_score)}
                </span>
              </div>
              <p className="text-sm font-medium line-clamp-2">{hook.hook_text}</p>
            </div>
          </div>
        )}

        {/* Reel Script */}
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">Reel Script</h3>
            <Button variant="ghost" size="sm" onClick={copyScript} className="h-7 text-xs">
              {copiedScript ? "Copied!" : "Copy Script"}
            </Button>
          </div>

          {/* Hook Section */}
          <div className="rounded-lg bg-primary/5 border border-primary/10 p-3 space-y-1.5">
            <Badge variant="outline" className="text-xs font-mono">
              HOOK 0-3s
            </Badge>
            <p className="text-sm font-medium">{reel_script.hook_line}</p>
            <p className="text-xs text-muted-foreground">
              Text overlay: &quot;{reel_script.hook_text_overlay}&quot;
            </p>
          </div>

          {/* Body Section */}
          <div className="rounded-lg bg-muted/50 border p-3 space-y-1.5">
            <Badge variant="outline" className="text-xs font-mono">
              BODY 3-15s
            </Badge>
            <ul className="text-sm space-y-1">
              {reel_script.body_lines.map((line, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-muted-foreground text-xs mt-0.5">{i + 1}.</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground italic">
              Visual: {reel_script.body_visual_direction}
            </p>
          </div>

          {/* CTA Section */}
          <div className="rounded-lg bg-green-50 border border-green-200 p-3 space-y-1.5">
            <Badge variant="outline" className="text-xs font-mono">
              CTA 15-20s
            </Badge>
            <p className="text-sm font-medium">{reel_script.cta_line}</p>
          </div>

          {/* Audio Recommendation */}
          {reel_script.audio_recommendation && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z"
                />
              </svg>
              <span>Audio: {reel_script.audio_recommendation}</span>
            </div>
          )}

          {/* Visual Style Notes */}
          {reel_script.visual_style_notes && (
            <p className="text-xs text-muted-foreground">
              Style notes: {reel_script.visual_style_notes}
            </p>
          )}
        </div>

        {/* SEO Caption */}
        <div className="p-4 border-t space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">SEO Caption</h3>
            <Button variant="ghost" size="sm" onClick={copyCaption} className="h-7 text-xs">
              {copiedCaption ? "Copied!" : "Copy Caption"}
            </Button>
          </div>
          <p className="text-sm whitespace-pre-wrap">{seo_caption.caption_text}</p>
          <div className="flex flex-wrap gap-1">
            {seo_caption.hashtags.map((tag) => (
              <span
                key={tag}
                className="text-xs px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>

        {/* Actions */}
        {onRegenerate && (
          <div className="px-4 pb-4">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => onRegenerate(script.hook_id)}
            >
              Regenerate
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
