"use client";

import type { Item } from "@/types/acnh";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function ItemsGrid({
  items,
  caughtSet,
  timesFor,
  onToggleCatch,
}: {
  items: Item[];
  caughtSet: Set<string>;
  timesFor: (item: Item) => string;
  onToggleCatch: (name: string) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {items.map((item) => {
        const isCaught = caughtSet.has(item.originalName);
        const timesText = timesFor(item);

        return (
          <Card
            key={item.originalName}
            onClick={() => onToggleCatch(item.originalName)}
            title={item.originalName}
            className={cn(
              "cursor-pointer transition border",
              "bg-white border-border hover:shadow-sm hover:border-primary/30",
              isCaught && "bg-muted/40 border-border/60"
            )}
          >
            <CardContent className="pt-0">
              <div className="w-full aspect-square">
                <img
                  src={item.image_url}
                  alt={item.name}
                  className={cn(
                    "w-full h-full object-contain transition",
                    isCaught && "opacity-70"
                  )}
                  loading="lazy"
                />
              </div>

              <div className="mt-2 text-center space-y-0.5">
                <div className="text-sm font-medium">{item.name}</div>

                {item.location && (
                  <div className="text-xs text-muted-foreground">
                    {item.location}
                  </div>
                )}

                {typeof item.sell_nook === "number" && (
                  <div className="text-xs text-muted-foreground/80">
                    {item.sell_nook.toLocaleString()} 벨
                  </div>
                )}

                {/* ← 추가: 그림자 크기 표시 (벨 아래) */}
                {item.shadow_size && (
                  <div className="text-[11px] text-muted-foreground/80">
                    그림자: {item.shadow_size}
                  </div>
                )}
              </div>
            </CardContent>

            <CardFooter className="pt-0">
              <div className="w-full text-center text-[11px] text-muted-foreground">
                {timesText}
              </div>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
