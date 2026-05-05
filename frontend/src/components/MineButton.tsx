"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { getSettings, mineHooks } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { MineHooksResponse, MiningConfigRecord } from "@/lib/types";

interface MineButtonProps {
  onComplete: (results?: MineHooksResponse) => void;
}

function TagField({
  value,
  onChange,
  placeholder,
  label,
  hint,
  disabled,
  variant = "default",
}: {
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  label: string;
  hint?: string;
  disabled?: boolean;
  variant?: "default" | "keyword";
}) {
  const [input, setInput] = useState("");

  function add() {
    const trimmed = input.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setInput("");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add();
    } else if (e.key === "Backspace" && !input && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  function remove(idx: number) {
    onChange(value.filter((_, i) => i !== idx));
  }

  const tagColor =
    variant === "keyword"
      ? "bg-violet-100 text-violet-700 border-violet-200"
      : "bg-indigo-100 text-indigo-700 border-indigo-200";

  return (
    <div>
      <label className="text-sm font-medium mb-1.5 block">{label}</label>
      <div
        className={cn(
          "rounded-md border bg-background p-2 max-h-[140px] overflow-y-auto",
          "focus-within:ring-2 focus-within:ring-ring/30 focus-within:border-ring",
          disabled && "opacity-60 pointer-events-none"
        )}
      >
        {value.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {value.map((tag, i) => (
              <span
                key={i}
                className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border",
                  tagColor
                )}
              >
                {variant === "keyword" ? tag : `#${tag}`}
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="hover:opacity-60 ml-0.5"
                  disabled={disabled}
                >
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
        )}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => input.trim() && add()}
          placeholder={value.length === 0 ? placeholder : "Type and press Enter..."}
          disabled={disabled}
          className="w-full bg-transparent outline-none text-sm placeholder:text-muted-foreground"
        />
      </div>
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
    </div>
  );
}

export function MineButton({ onComplete }: MineButtonProps) {
  const [open, setOpen] = useState(false);
  const [platform, setPlatform] = useState<"tiktok" | "instagram">("tiktok");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>(["en"]);
  const [maxResults, setMaxResults] = useState(50);
  const [mining, setMining] = useState(false);
  const [configs, setConfigs] = useState<MiningConfigRecord[]>([]);

  // Load saved settings when dialog opens
  useEffect(() => {
    if (open && configs.length === 0) {
      getSettings().then(setConfigs).catch(() => {});
    }
  }, [open, configs.length]);

  // Populate fields from config when platform changes or configs load
  useEffect(() => {
    const config = configs.find((c) => c.platform === platform);
    if (config) {
      setHashtags(config.hashtags);
      setKeywords(config.search_queries || []);
      setLanguages(config.languages || ["en"]);
      setMaxResults(config.max_results);
    }
  }, [platform, configs]);

  async function handleMine() {
    if (hashtags.length === 0 && keywords.length === 0) {
      toast.error("Add at least one hashtag or keyword");
      return;
    }

    setMining(true);
    try {
      const result = await mineHooks({
        platform,
        hashtags,
        search_queries: keywords.length > 0 ? keywords : undefined,
        languages: languages.length > 0 ? languages : undefined,
        max_results: maxResults,
      });
      toast.success(`Mined ${result.hooks_mined} new hooks from ${platform}`);
      setOpen(false);
      onComplete(result);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Mining failed");
    } finally {
      setMining(false);
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>Mine New Hooks</Button>
      <Dialog open={open} onOpenChange={(v) => !mining && setOpen(v)}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Mine New Hooks</DialogTitle>
            <DialogDescription>
              Scrape viral posts, analyze video content, and auto-generate reel scripts.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 mt-2">
            {/* Platform + Max results row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Platform</label>
                <Select
                  value={platform}
                  onValueChange={(v) => setPlatform(v as "tiktok" | "instagram")}
                  disabled={mining}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tiktok">TikTok</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Max results</label>
                <Input
                  type="number"
                  value={maxResults}
                  onChange={(e) => setMaxResults(parseInt(e.target.value) || 50)}
                  min={1}
                  max={1000}
                  disabled={mining}
                />
              </div>
            </div>

            <TagField
              label="Hashtags"
              value={hashtags}
              onChange={setHashtags}
              placeholder="e.g. amazonfba, ecommercetips"
              disabled={mining}
              variant="default"
            />

            <TagField
              label="Search Keywords"
              value={keywords}
              onChange={setKeywords}
              placeholder="e.g. product photography tips"
              hint="Keywords search post captions — works better than hashtags for Instagram"
              disabled={mining}
              variant="keyword"
            />

            <TagField
              label="Languages"
              value={languages}
              onChange={setLanguages}
              placeholder="en"
              hint="ISO codes: en (English), hi (Hindi), es (Spanish)"
              disabled={mining}
              variant="default"
            />

            <Button onClick={handleMine} disabled={mining} className="w-full">
              {mining ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Mining &amp; generating scripts...
                </span>
              ) : (
                `Start Mining (${hashtags.length + keywords.length} sources)`
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
