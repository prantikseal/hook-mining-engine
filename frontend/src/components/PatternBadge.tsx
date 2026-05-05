"use client";

import { Badge } from "@/components/ui/badge";
import { PATTERN_COLORS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface PatternBadgeProps {
  patternType: string;
  className?: string;
}

export function PatternBadge({ patternType, className }: PatternBadgeProps) {
  const colors = PATTERN_COLORS[patternType] ?? {
    bg: "bg-gray-50",
    text: "text-gray-700",
    border: "border-gray-200",
  };

  return (
    <Badge
      variant="outline"
      className={cn(colors.bg, colors.text, colors.border, "font-medium", className)}
    >
      {patternType}
    </Badge>
  );
}
