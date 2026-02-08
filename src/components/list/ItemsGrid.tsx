"use client"

import { useTranslations } from "next-intl"
import type { Item } from "@/types/acnh"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import Image from "next/image"

interface ItemsGridProps {
  items: Item[]
  caughtSet: Set<string>
  timesFor: (item: Item) => string
  onToggleCatch: (name: string) => void
}

export default function ItemsGrid({
  items,
  caughtSet,
  timesFor,
  onToggleCatch,
}: ItemsGridProps) {
  const t = useTranslations("list")

  return (
    <div className="grid grid-cols-3 gap-3">
      {items.map((item, index) => {
        const isCaught = caughtSet.has(item.originalName)
        const timesText = timesFor(item)
        const isLcpImage = index < 6

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
              <div className="w-full aspect-square relative">
                <Image
                  src={item.image_url}
                  alt={item.name}
                  fill
                  className={cn(
                    "object-contain transition",
                    isCaught && "opacity-70"
                  )}
                  sizes="(max-width: 640px) 30vw, (max-width: 768px) 25vw, 200px"
                  priority={isLcpImage}
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
                    {item.sell_nook.toLocaleString()} {t("bells")}
                  </div>
                )}

                {item.shadow_size && (
                  <div className="text-[11px] text-muted-foreground/80">
                    {t("shadow")}: {item.shadow_size}
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
        )
      })}
    </div>
  )
}
