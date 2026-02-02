"use client"

import type { Item } from "@/types/acnh"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import Image from "next/image"

interface ItemsGridProps {
  /** 표시할 아이템 목록 */
  items: Item[]
  /** 잡은 아이템 이름 Set */
  caughtSet: Set<string>
  /** 아이템의 시간 정보를 문자열로 변환하는 함수 */
  timesFor: (item: Item) => string
  /** 아이템 잡기/풀기 토글 핸들러 */
  onToggleCatch: (name: string) => void
}

/**
 * 아이템 그리드 컴포넌트
 * 
 * 3열 그리드 레이아웃으로 아이템을 표시하며, 각 아이템은 카드 형태로 렌더링됩니다.
 * 잡은 아이템은 시각적으로 구분되며, 클릭 시 잡기/풀기 상태를 토글할 수 있습니다.
 * 
 * @param props - ItemsGridProps
 */
export default function ItemsGrid({
  items,
  caughtSet,
  timesFor,
  onToggleCatch,
}: ItemsGridProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {items.map((item, index) => {
        const isCaught = caughtSet.has(item.originalName)
        const timesText = timesFor(item)
        // 첫 번째 이미지에 priority 적용 (LCP 최적화)
        // Largest Contentful Paint를 개선하기 위해 첫 번째 이미지를 우선 로드합니다
        const isLcpImage = index === 0

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
                  sizes="(max-width: 768px) 33vw, 200px"
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
        )
      })}
    </div>
  )
}
