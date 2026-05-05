"use client";

import { useState } from "react";
import { MiningSettings } from "@/components/MiningSettings";
import { BrandConfig } from "@/components/BrandConfig";
import { cn } from "@/lib/utils";

type Tab = "mining" | "brand";

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>("mining");

  return (
    <div className="flex-1 flex flex-col">
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center gap-4">
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </a>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Configure mining, brand profile, and content generation
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1 -mb-px">
            <button
              onClick={() => setTab("mining")}
              className={cn(
                "px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",
                tab === "mining"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              Mining Config
            </button>
            <button
              onClick={() => setTab("brand")}
              className={cn(
                "px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",
                tab === "brand"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              Brand Profile
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
        {tab === "mining" ? <MiningSettings /> : <BrandConfig />}
      </main>
    </div>
  );
}
