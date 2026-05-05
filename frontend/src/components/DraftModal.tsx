"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PatternBadge } from "./PatternBadge";
import { ScriptCard } from "./ScriptCard";
import { generateScript } from "@/lib/api";
import { TOPIC_SUGGESTIONS } from "@/lib/constants";
import type { HookRecord, GenerateScriptResponse } from "@/lib/types";

interface DraftModalProps {
  hook: HookRecord | null;
  open: boolean;
  onClose: () => void;
}

export function DraftModal({ hook, open, onClose }: DraftModalProps) {
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerateScriptResponse | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  useEffect(() => {
    if (open) {
      setTopic("");
      reset();
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, reset]);

  async function handleGenerate() {
    if (!hook || !topic.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await generateScript({ hook_id: hook.id, topic: topic.trim() });
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Generate Script
            {hook && <PatternBadge patternType={hook.pattern_type} />}
          </DialogTitle>
          <DialogDescription>
            Enter a topic to generate a reel script + SEO caption using this hook pattern.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 mt-2">
          {hook && (
            <div className="bg-muted rounded-lg p-3">
              <p className="text-sm font-medium">&quot;{hook.hook_text}&quot;</p>
            </div>
          )}

          <div className="flex gap-2">
            <Input
              ref={inputRef}
              placeholder="Enter a topic (e.g., AI product photography)"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
              disabled={loading}
            />
            <Button onClick={handleGenerate} disabled={loading || !topic.trim()}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Generating
                </span>
              ) : "Generate"}
            </Button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {TOPIC_SUGGESTIONS.map((s) => (
              <button
                key={s}
                className="text-xs px-2 py-1 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                onClick={() => setTopic(s)}
                disabled={loading}
              >
                {s}
              </button>
            ))}
          </div>

          {error && (
            <div className="bg-destructive/10 text-destructive text-sm rounded-lg p-3">
              {error}
            </div>
          )}

          {result && (
            <div className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
              <ScriptCard
                script={result}
                hook={hook ?? undefined}
                onRegenerate={() => handleGenerate()}
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
