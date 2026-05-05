"use client";

import { useEffect, useState } from "react";
import { getCronStatus } from "@/lib/api";
import type { CronStatusResponse } from "@/lib/types";

export function CronStatus() {
  const [status, setStatus] = useState<CronStatusResponse | null>(null);

  useEffect(() => {
    getCronStatus().then(setStatus).catch(() => {});
  }, []);

  if (!status) return null;

  function formatDate(iso: string | null) {
    if (!iso) return "Never";
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  return (
    <div className="flex items-center gap-4 text-xs text-muted-foreground">
      <span>
        Last auto-mine: <strong>{formatDate(status.last_run)}</strong>
      </span>
      <span className="text-border">|</span>
      <span>
        Next run: <strong>{formatDate(status.next_run)}</strong>
      </span>
      <span className="text-border">|</span>
      <span>
        Total hooks: <strong className="font-mono">{status.total_hooks}</strong>
      </span>
    </div>
  );
}
