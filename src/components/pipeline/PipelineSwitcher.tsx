"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

type Pipeline = { id: string; name: string; count: number };

export function PipelineSwitcher({
  pipelines,
  selectedId,
}: {
  pipelines: Pipeline[];
  selectedId: string | null;
}) {
  if (pipelines.length <= 1) return null;

  return (
    <div className="flex flex-wrap gap-2 border-b pb-3">
      {pipelines.map((p) => {
        const active = p.id === selectedId;
        return (
          <Link
            key={p.id}
            href={`/pipeline?pipeline=${p.id}`}
            className={cn(
              "flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-colors cursor-pointer",
              active
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/70"
            )}
          >
            {p.name}
            <span
              className={cn(
                "inline-flex items-center justify-center rounded-full px-1.5 min-w-5 h-5 text-xs",
                active ? "bg-primary-foreground/20" : "bg-background",
                p.count > 0 && !active ? "text-foreground font-semibold" : ""
              )}
            >
              {p.count}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
