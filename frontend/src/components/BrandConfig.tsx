"use client";

import { useCallback, useEffect, useState } from "react";
import { getBrandConfig, updateBrandConfig, regenerateBrandConfig } from "@/lib/api";
import type { BrandConfigRecord, BrandConfigUpdate, TargetAudience, VoiceConfig } from "@/lib/types";
import { cn } from "@/lib/utils";

type RegenerateSection = "all" | "voice" | "audience" | "content" | "ctas";

function TagInput({
  value,
  onChange,
  placeholder,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  const [input, setInput] = useState("");

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if ((e.key === "Enter" || e.key === ",") && input.trim()) {
      e.preventDefault();
      if (!value.includes(input.trim())) {
        onChange([...value, input.trim()]);
      }
      setInput("");
    } else if (e.key === "Backspace" && !input && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  function remove(idx: number) {
    onChange(value.filter((_, i) => i !== idx));
  }

  return (
    <div className="flex flex-wrap gap-1.5 p-2 border rounded-md bg-background min-h-[42px]">
      {value.map((tag, i) => (
        <span
          key={i}
          className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary rounded text-sm"
        >
          {tag}
          <button
            type="button"
            onClick={() => remove(i)}
            className="hover:text-destructive"
          >
            &times;
          </button>
        </span>
      ))}
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={value.length === 0 ? placeholder : ""}
        className="flex-1 min-w-[120px] bg-transparent outline-none text-sm"
      />
    </div>
  );
}

function ListEditor({
  value,
  onChange,
  placeholder,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  function updateItem(idx: number, text: string) {
    const next = [...value];
    next[idx] = text;
    onChange(next);
  }

  function removeItem(idx: number) {
    onChange(value.filter((_, i) => i !== idx));
  }

  function addItem() {
    onChange([...value, ""]);
  }

  return (
    <div className="space-y-2">
      {value.map((item, i) => (
        <div key={i} className="flex gap-2">
          <input
            value={item}
            onChange={(e) => updateItem(i, e.target.value)}
            placeholder={placeholder}
            className="flex-1 rounded-md border bg-background px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={() => removeItem(i)}
            className="px-2 text-muted-foreground hover:text-destructive"
          >
            &times;
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addItem}
        className="text-sm text-primary hover:underline"
      >
        + Add item
      </button>
    </div>
  );
}

export function BrandConfig() {
  const [config, setConfig] = useState<BrandConfigRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState<RegenerateSection | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getBrandConfig();
      setConfig(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load brand config");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function update(patch: Partial<BrandConfigRecord>) {
    if (!config) return;
    setConfig({ ...config, ...patch });
    setDirty(true);
    setSuccess(null);
  }

  function updateAudience(patch: Partial<TargetAudience>) {
    if (!config) return;
    setConfig({
      ...config,
      target_audience: { ...config.target_audience, ...patch },
    });
    setDirty(true);
    setSuccess(null);
  }

  function updateVoice(patch: Partial<VoiceConfig>) {
    if (!config) return;
    setConfig({
      ...config,
      voice: { ...config.voice, ...patch },
    });
    setDirty(true);
    setSuccess(null);
  }

  async function handleSave() {
    if (!config) return;
    setSaving(true);
    setError(null);
    try {
      const body: BrandConfigUpdate = {
        handle: config.handle,
        name: config.name,
        tagline: config.tagline,
        website: config.website,
        instagram: config.instagram,
        product_description: config.product_description,
        key_features: config.key_features,
        target_audience: config.target_audience,
        voice: config.voice,
        content_pillars: config.content_pillars,
        ctas: config.ctas,
        branded_hashtag: config.branded_hashtag,
        core_hashtags: config.core_hashtags,
      };
      const updated = await updateBrandConfig(body);
      setConfig(updated);
      setDirty(false);
      setSuccess("Brand config saved successfully");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleRegenerate(section: RegenerateSection) {
    setRegenerating(section);
    setError(null);
    setSuccess(null);
    try {
      const updated = await regenerateBrandConfig(section === "all" ? undefined : section);
      setConfig(updated);
      setDirty(false);
      setSuccess(`AI regenerated ${section === "all" ? "all sections" : section} successfully`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Regeneration failed");
    } finally {
      setRegenerating(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!config) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <p>No brand config found. Run the migration first.</p>
        {error && <p className="text-destructive mt-2">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Status messages */}
      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-md border border-green-500/50 bg-green-500/10 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      {/* AI Regenerate bar */}
      <div className="rounded-lg border bg-gradient-to-r from-indigo-50 to-violet-50 p-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="font-semibold text-sm">AI Regeneration</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Use AI to improve specific sections or the entire brand config
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(["voice", "audience", "content", "ctas", "all"] as RegenerateSection[]).map(
              (section) => (
                <button
                  key={section}
                  onClick={() => handleRegenerate(section)}
                  disabled={regenerating !== null}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                    "border border-primary/30 text-primary hover:bg-primary/10",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    regenerating === section && "animate-pulse bg-primary/10"
                  )}
                >
                  {regenerating === section ? (
                    <span className="flex items-center gap-1.5">
                      <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Regenerating...
                    </span>
                  ) : section === "all" ? (
                    "Regenerate All"
                  ) : (
                    `Regenerate ${section.charAt(0).toUpperCase() + section.slice(1)}`
                  )}
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Basic Info */}
      <section className="rounded-lg border bg-card p-6 space-y-4">
        <h2 className="text-lg font-semibold">Basic Info</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Handle</label>
            <input
              value={config.handle}
              onChange={(e) => update({ handle: e.target.value })}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Name</label>
            <input
              value={config.name}
              onChange={(e) => update({ name: e.target.value })}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Tagline</label>
            <input
              value={config.tagline}
              onChange={(e) => update({ tagline: e.target.value })}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Website</label>
            <input
              value={config.website}
              onChange={(e) => update({ website: e.target.value })}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-muted-foreground">Instagram</label>
            <input
              value={config.instagram}
              onChange={(e) => update({ instagram: e.target.value })}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-muted-foreground">Product Description</label>
            <textarea
              value={config.product_description}
              onChange={(e) => update({ product_description: e.target.value })}
              rows={3}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="rounded-lg border bg-card p-6 space-y-4">
        <h2 className="text-lg font-semibold">Key Features</h2>
        <ListEditor
          value={config.key_features}
          onChange={(v) => update({ key_features: v })}
          placeholder="e.g., AI product photography"
        />
      </section>

      {/* Target Audience */}
      <section className="rounded-lg border bg-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Target Audience</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Primary Audiences</label>
            <TagInput
              value={config.target_audience.primary}
              onChange={(v) => updateAudience({ primary: v })}
              placeholder="Type and press Enter..."
            />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Secondary Audiences</label>
            <TagInput
              value={config.target_audience.secondary}
              onChange={(v) => updateAudience({ secondary: v })}
              placeholder="Type and press Enter..."
            />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Demographics</label>
            <input
              value={config.target_audience.demographics}
              onChange={(e) => updateAudience({ demographics: e.target.value })}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Pain Points</label>
            <ListEditor
              value={config.target_audience.pain_points}
              onChange={(v) => updateAudience({ pain_points: v })}
              placeholder="e.g., Product photos are expensive"
            />
          </div>
        </div>
      </section>

      {/* Voice */}
      <section className="rounded-lg border bg-card p-6 space-y-4">
        <h2 className="text-lg font-semibold">Brand Voice</h2>
        <div>
          <label className="text-sm font-medium text-muted-foreground">Personality</label>
          <input
            value={config.voice.personality}
            onChange={(e) => updateVoice({ personality: e.target.value })}
            className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-muted-foreground">Do&apos;s</label>
          <ListEditor
            value={config.voice.do}
            onChange={(v) => updateVoice({ do: v })}
            placeholder="e.g., Be specific with numbers"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-muted-foreground">Don&apos;ts</label>
          <ListEditor
            value={config.voice.dont}
            onChange={(v) => updateVoice({ dont: v })}
            placeholder="e.g., Sound corporate"
          />
        </div>
      </section>

      {/* Content Pillars */}
      <section className="rounded-lg border bg-card p-6 space-y-4">
        <h2 className="text-lg font-semibold">Content Pillars</h2>
        <ListEditor
          value={config.content_pillars}
          onChange={(v) => update({ content_pillars: v })}
          placeholder="e.g., Before/After transformations"
        />
      </section>

      {/* CTAs */}
      <section className="rounded-lg border bg-card p-6 space-y-4">
        <h2 className="text-lg font-semibold">CTAs (Calls to Action)</h2>
        <ListEditor
          value={config.ctas}
          onChange={(v) => update({ ctas: v })}
          placeholder="e.g., Try Pixii free — link in bio"
        />
      </section>

      {/* Hashtags */}
      <section className="rounded-lg border bg-card p-6 space-y-4">
        <h2 className="text-lg font-semibold">Hashtag Strategy</h2>
        <div>
          <label className="text-sm font-medium text-muted-foreground">Branded Hashtag</label>
          <input
            value={config.branded_hashtag}
            onChange={(e) => update({ branded_hashtag: e.target.value })}
            className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-muted-foreground">Core Hashtags</label>
          <TagInput
            value={config.core_hashtags}
            onChange={(v) => update({ core_hashtags: v })}
            placeholder="Type and press Enter..."
          />
        </div>
      </section>

      {/* Save button */}
      <div className="sticky bottom-4 flex justify-end">
        <button
          onClick={handleSave}
          disabled={!dirty || saving}
          className={cn(
            "px-6 py-2.5 rounded-lg font-medium text-sm transition-all shadow-lg",
            dirty
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "bg-muted text-muted-foreground cursor-not-allowed",
            saving && "opacity-70"
          )}
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
