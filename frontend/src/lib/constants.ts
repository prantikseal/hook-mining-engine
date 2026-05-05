export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const PATTERN_TYPES = [
  "Contrarian",
  "How-To",
  "Story-Open",
  "Social-Proof",
  "FOMO",
  "Identity",
  "Pattern-Interrupt",
  "Question",
] as const;

export const PATTERN_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Contrarian:         { bg: "bg-red-50",     text: "text-red-700",     border: "border-red-200" },
  "How-To":           { bg: "bg-blue-50",    text: "text-blue-700",    border: "border-blue-200" },
  "Story-Open":       { bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200" },
  "Social-Proof":     { bg: "bg-green-50",   text: "text-green-700",   border: "border-green-200" },
  FOMO:               { bg: "bg-orange-50",  text: "text-orange-700",  border: "border-orange-200" },
  Identity:           { bg: "bg-purple-50",  text: "text-purple-700",  border: "border-purple-200" },
  "Pattern-Interrupt": { bg: "bg-pink-50",   text: "text-pink-700",    border: "border-pink-200" },
  Question:           { bg: "bg-cyan-50",    text: "text-cyan-700",    border: "border-cyan-200" },
};

export const TOPIC_SUGGESTIONS = [
  "AI product photography",
  "Amazon listing optimization",
  "Catalog scaling with AI",
  "Conversion-boosting visuals",
  "A+ Content design",
  "TikTok Shop listings",
  "E-commerce visual branding",
  "Product photo automation",
];
