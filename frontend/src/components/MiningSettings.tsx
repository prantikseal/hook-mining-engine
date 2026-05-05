"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { getSettings, updateSettings } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { MiningConfigRecord } from "@/lib/types";

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
          "rounded-md border bg-background p-2 min-h-[44px]",
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
      <p className="text-xs text-muted-foreground mt-0.5">{value.length} items</p>
    </div>
  );
}

function PlatformConfig({
  config,
  onSave,
}: {
  config: MiningConfigRecord;
  onSave: (c: MiningConfigRecord) => void;
}) {
  const [hashtags, setHashtags] = useState<string[]>(config.hashtags);
  const [searchQueries, setSearchQueries] = useState<string[]>(config.search_queries || []);
  const [languages, setLanguages] = useState<string[]>(config.languages || ["en"]);
  const [maxResults, setMaxResults] = useState(String(config.max_results));
  const [enabled, setEnabled] = useState(config.enabled);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const updated = await updateSettings(config.platform, {
        hashtags,
        search_queries: searchQueries,
        languages: languages.length > 0 ? languages : ["en"],
        max_results: parseInt(maxResults) || 500,
        enabled,
      });
      onSave(updated);
      toast.success(`${config.platform} settings saved`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  const icon =
    config.platform === "tiktok" ? (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.75a8.18 8.18 0 0 0 4.76 1.52V6.82a4.83 4.83 0 0 1-1-.13z" />
      </svg>
    ) : (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
      </svg>
    );

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">{icon}</span>
            <CardTitle className="text-base capitalize">{config.platform}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {enabled ? "Enabled" : "Disabled"}
            </span>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <TagField
          label="Hashtags"
          value={hashtags}
          onChange={setHashtags}
          placeholder="e.g. amazonfba, ecommercetips"
          hint="Tags used to discover posts on the platform"
          variant="default"
        />

        <TagField
          label="Search Keywords"
          value={searchQueries}
          onChange={setSearchQueries}
          placeholder="e.g. product photography tips"
          hint="Full-text keyword searches — works better than hashtags for Instagram Reels"
          variant="keyword"
        />

        <div className="grid grid-cols-2 gap-4">
          <TagField
            label="Languages"
            value={languages}
            onChange={setLanguages}
            placeholder="en"
            hint="ISO codes: en, hi, es, fr"
            variant="default"
          />
          <div>
            <label className="text-sm font-medium mb-1.5 block">Max results per run</label>
            <Input
              type="number"
              value={maxResults}
              onChange={(e) => setMaxResults(e.target.value)}
              min={1}
              max={1000}
            />
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving} size="sm" className="self-end">
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </CardContent>
    </Card>
  );
}

export function MiningSettings() {
  const [configs, setConfigs] = useState<MiningConfigRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSettings()
      .then(setConfigs)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function handleSave(updated: MiningConfigRecord) {
    setConfigs((prev) =>
      prev.map((c) => (c.platform === updated.platform ? updated : c))
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {configs.map((config) => (
        <PlatformConfig key={config.platform} config={config} onSave={handleSave} />
      ))}
    </div>
  );
}
