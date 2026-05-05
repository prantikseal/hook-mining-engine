"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PatternBadge } from "./PatternBadge";
import { formatEngagement } from "@/lib/utils";
import type { GeneratedScriptRecord, HookRecord } from "@/lib/types";

interface HookDetailModalProps {
  hook: HookRecord;
  scripts?: GeneratedScriptRecord[];
  open: boolean;
  onClose: () => void;
  onGenerate: (hook: HookRecord) => void;
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <Button variant="ghost" size="sm" onClick={handleCopy} className="h-7 text-xs">
      {copied ? "Copied!" : label}
    </Button>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">{label}</h4>
      {children}
    </div>
  );
}

function ScriptSection({ script }: { script: GeneratedScriptRecord }) {
  const fullScript = [
    `HOOK (0-3s): "${script.hook_line}"`,
    `TEXT OVERLAY: "${script.hook_text_overlay}"`,
    "",
    `BODY (3-15s):`,
    ...script.body_lines.map((l, i) => `  ${i + 1}. ${l}`),
    `VISUAL: ${script.body_visual_direction}`,
    "",
    `CTA (15-20s): "${script.cta_line}"`,
    script.audio_recommendation ? `\nAUDIO: ${script.audio_recommendation}` : "",
  ].filter(Boolean).join("\n");

  const fullCaption = `${script.caption_text}\n\n${script.caption_hashtags.map((h) => `#${h}`).join(" ")}`;

  return (
    <div className="space-y-3">
      {/* Script */}
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Reel Script</h4>
        <CopyButton text={fullScript} label="Copy Script" />
      </div>

      <div className="rounded-lg bg-primary/5 border border-primary/10 p-3 space-y-1">
        <Badge variant="outline" className="text-[10px] font-mono">HOOK 0-3s</Badge>
        <p className="text-sm font-medium">{script.hook_line}</p>
        <p className="text-xs text-muted-foreground">Overlay: &quot;{script.hook_text_overlay}&quot;</p>
      </div>

      <div className="rounded-lg bg-muted/50 border p-3 space-y-1">
        <Badge variant="outline" className="text-[10px] font-mono">BODY 3-15s</Badge>
        <ul className="text-sm space-y-0.5">
          {script.body_lines.map((line, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-muted-foreground text-xs mt-0.5">{i + 1}.</span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted-foreground italic">Visual: {script.body_visual_direction}</p>
      </div>

      <div className="rounded-lg bg-green-50 border border-green-200 p-3 space-y-1">
        <Badge variant="outline" className="text-[10px] font-mono">CTA 15-20s</Badge>
        <p className="text-sm font-medium">{script.cta_line}</p>
      </div>

      {script.audio_recommendation && (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <svg className="h-3 w-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" />
          </svg>
          Audio: {script.audio_recommendation}
        </p>
      )}

      {script.visual_style_notes && (
        <p className="text-xs text-muted-foreground">Style: {script.visual_style_notes}</p>
      )}

      {/* Caption */}
      <div className="border-t pt-3 space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">SEO Caption</h4>
          <CopyButton text={fullCaption} label="Copy Caption" />
        </div>
        <p className="text-sm whitespace-pre-wrap">{script.caption_text}</p>
        <div className="flex flex-wrap gap-1">
          {script.caption_hashtags.map((tag) => (
            <span key={tag} className="text-xs px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
              #{tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function HookDetailModal({ hook, scripts, open, onClose, onGenerate }: HookDetailModalProps) {
  const latestScript = scripts?.[0];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 flex-wrap">
            <PatternBadge patternType={hook.pattern_type} />
            <span className="text-muted-foreground text-sm font-normal">
              {hook.source_platform === "tiktok" ? "TikTok" : "Instagram"}
            </span>
            {hook.created_at && (
              <span className="text-muted-foreground text-xs font-normal">
                {new Date(hook.created_at).toLocaleDateString()}
              </span>
            )}
          </DialogTitle>
          <DialogDescription>Full details for this hook and its source content.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5 mt-2">
          {/* Stats bar */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span className="font-mono font-semibold">{formatEngagement(hook.engagement_score)}</span>
              <span className="text-muted-foreground">engagement</span>
            </div>
            {hook.view_count > 0 && (
              <div className="flex items-center gap-1.5">
                <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span className="font-mono font-semibold">{formatEngagement(hook.view_count)}</span>
                <span className="text-muted-foreground">views</span>
              </div>
            )}
            {hook.duration_seconds != null && hook.duration_seconds > 0 && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{hook.duration_seconds}s</span>
              </div>
            )}
          </div>

          {/* Thumbnail + video */}
          {hook.thumbnail_url && (
            <div className="relative rounded-lg overflow-hidden">
              <img src={hook.thumbnail_url} alt="" className="w-full max-h-64 object-cover" />
              {hook.video_url && (
                <a
                  href={hook.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity"
                >
                  <div className="bg-white/90 rounded-full p-3">
                    <svg className="h-8 w-8 text-black" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </a>
              )}
            </div>
          )}
          {!hook.thumbnail_url && hook.video_url && (
            <a
              href={hook.video_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary underline flex items-center gap-1"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Open original video
            </a>
          )}

          {/* Hook text */}
          <Section label="Hook">
            <p className="text-base font-semibold leading-snug">{hook.hook_text}</p>
          </Section>

          {/* Explanation */}
          {hook.explanation && (
            <Section label="Why it works">
              <p className="text-sm text-muted-foreground">{hook.explanation}</p>
            </Section>
          )}

          {/* Original caption */}
          <Section label="Original Caption">
            <div className="bg-muted rounded-lg p-3 max-h-40 overflow-y-auto">
              <p className="text-sm whitespace-pre-wrap">{hook.original_text}</p>
            </div>
            <div className="flex justify-end mt-1">
              <CopyButton text={hook.original_text} label="Copy" />
            </div>
          </Section>

          {/* Transcript */}
          {hook.transcript && (
            <Section label="Video Transcript">
              <div className="bg-muted rounded-lg p-3 max-h-40 overflow-y-auto">
                <p className="text-sm whitespace-pre-wrap">{hook.transcript}</p>
              </div>
              <div className="flex justify-end mt-1">
                <CopyButton text={hook.transcript} label="Copy" />
              </div>
            </Section>
          )}

          {/* Visual texts */}
          {hook.visual_texts && (
            <Section label="Text Detected in Video">
              <div className="bg-muted rounded-lg p-3">
                <p className="text-sm whitespace-pre-wrap">{hook.visual_texts}</p>
              </div>
            </Section>
          )}

          {/* Audio */}
          {hook.audio_track_name && (
            <Section label="Audio">
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 text-muted-foreground flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" />
                </svg>
                <span className="text-sm">{hook.audio_track_name}</span>
                {hook.audio_url && (
                  <a
                    href={hook.audio_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary underline"
                  >
                    Listen
                  </a>
                )}
              </div>
            </Section>
          )}

          {/* Generated Script */}
          {latestScript && (
            <div className="border-t pt-4">
              <ScriptSection script={latestScript} />
            </div>
          )}

          {/* Actions */}
          <div className="border-t pt-4 flex gap-2">
            <Button className="flex-1" onClick={() => { onClose(); onGenerate(hook); }}>
              {latestScript ? "Regenerate Script" : "Generate Script"}
            </Button>
            {hook.video_url && (
              <a href={hook.video_url} target="_blank" rel="noopener noreferrer">
                <Button variant="outline">Open Video</Button>
              </a>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
