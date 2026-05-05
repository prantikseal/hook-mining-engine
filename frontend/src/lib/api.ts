import { API_BASE } from "./constants";
import type {
  BrandConfigRecord,
  BrandConfigUpdate,
  CronStatusResponse,
  GenerateScriptRequest,
  GenerateScriptResponse,
  GeneratedScriptRecord,
  HookRecord,
  MineHooksRequest,
  MineHooksResponse,
  MiningConfigRecord,
  MiningConfigUpdate,
} from "./types";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Request failed: ${res.status}`);
  }
  return res.json();
}

export function fetchHooks(params?: {
  pattern_type?: string;
  limit?: number;
  offset?: number;
}): Promise<HookRecord[]> {
  const search = new URLSearchParams();
  if (params?.pattern_type) search.set("pattern_type", params.pattern_type);
  if (params?.limit) search.set("limit", String(params.limit));
  if (params?.offset) search.set("offset", String(params.offset));
  const qs = search.toString();
  return request<HookRecord[]>(`/api/hooks${qs ? `?${qs}` : ""}`);
}

export function mineHooks(body: MineHooksRequest): Promise<MineHooksResponse> {
  return request<MineHooksResponse>("/api/mine_hooks", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function generateScript(body: GenerateScriptRequest): Promise<GenerateScriptResponse> {
  return request<GenerateScriptResponse>("/api/generate_script", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function fetchScripts(hookId?: string): Promise<GeneratedScriptRecord[]> {
  const search = new URLSearchParams();
  if (hookId) search.set("hook_id", hookId);
  const qs = search.toString();
  return request<GeneratedScriptRecord[]>(`/api/scripts${qs ? `?${qs}` : ""}`);
}

export function getCronStatus(): Promise<CronStatusResponse> {
  return request<CronStatusResponse>("/api/cron/status");
}

export function getSettings(): Promise<MiningConfigRecord[]> {
  return request<MiningConfigRecord[]>("/api/settings");
}

export function updateSettings(
  platform: string,
  body: MiningConfigUpdate
): Promise<MiningConfigRecord> {
  return request<MiningConfigRecord>(`/api/settings/${platform}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export function getBrandConfig(): Promise<BrandConfigRecord> {
  return request<BrandConfigRecord>("/api/brand-config");
}

export function updateBrandConfig(
  body: BrandConfigUpdate
): Promise<BrandConfigRecord> {
  return request<BrandConfigRecord>("/api/brand-config", {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export function regenerateBrandConfig(
  section?: string
): Promise<BrandConfigRecord> {
  const qs = section ? `?section=${section}` : "";
  return request<BrandConfigRecord>(`/api/brand-config/regenerate${qs}`, {
    method: "POST",
  });
}
