// src/app/list/page.tsx
"use client";

import { useMemo, useState } from "react";
import useQueryTab from "@/hook/useQueryTab";
import type { Category } from "@/types/acnh";
import { isAvailableAtHour, formatTimesForMonth } from "@/lib/time";

import { useLocalUser } from "@/hook/useLocalUser";
import { useCaughtItems } from "@/hook/useCaughtItems";
import { useNookipediaItems } from "@/hook/useNookipediaItems";

import ListHeader from "@/components/list/ListHeader";
import ItemsGrid from "@/components/list/ItemsGrid";
import ItemsGridSkeleton from "@/components/list/ItemsGridSkeleton";
import ListHeaderSkeleton from "@/components/list/ListHeaderSkeleton";

const CATEGORY_TABS: Category[] = ["fish", "bug", "sea", "fossil"];

// 페이지 안에서만 쓰는 간단한 빈 상태
function EmptyState({ text }: { text: string }) {
  return (
    <div className="text-sm text-muted-foreground py-12 text-center">
      {text}
    </div>
  );
}

export default function ListPage() {
  const { activeTab, setTab } = useQueryTab<Category>("tab", "fish", CATEGORY_TABS);
  const user = useLocalUser();

  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedHour, setSelectedHour] = useState<number>(new Date().getHours());

  const { items, loading: itemsLoading } = useNookipediaItems({
    enabled: !!user,
    category: activeTab,
    hemisphere: user?.hemisphere === "south" ? "south" : "north",
    month: selectedMonth,
  });

  const { caughtSet, toggleCatch, loading: caughtLoading } = useCaughtItems({
    enabled: !!user,
    userId: user?.id,
    category: activeTab,
  });

  const hemi: "north" | "south" = user?.hemisphere === "south" ? "south" : "north";
  const loading = itemsLoading || caughtLoading;

  const displayed = useMemo(() => {
    const filtered = items.filter((it) =>
      isAvailableAtHour(it, selectedMonth, selectedHour, hemi)
    );
    return filtered
      .slice()
      .sort((a, b) => {
        const aCaught = caughtSet.has(a.originalName) ? 1 : 0;
        const bCaught = caughtSet.has(b.originalName) ? 1 : 0;
        if (aCaught !== bCaught) return aCaught - bCaught;
        return a.name.localeCompare(b.name, "ko");
      });
  }, [items, caughtSet, selectedMonth, selectedHour, hemi]);

  if (!user) return null;

  return (
    <div className="p-4">
      {loading ? (
        <>
          <ListHeaderSkeleton />
          <ItemsGridSkeleton count={9} />
        </>
      ) : (
        <>
          <ListHeader
            username={user.username}
            hemisphere={hemi}
            tabs={CATEGORY_TABS}
            activeTab={activeTab}
            onChangeTab={setTab}
            selectedMonth={selectedMonth}
            onChangeMonth={setSelectedMonth}
            selectedHour={selectedHour}
            onChangeHour={setSelectedHour}
          />

          {displayed.length === 0 ? (
            <div className="text-sm text-muted-foreground py-12 text-center">
              해당 조건에 맞는 항목이 없습니다.
            </div>

          ) : (
            <ItemsGrid
              items={displayed}
              caughtSet={caughtSet}
              timesFor={(it) => formatTimesForMonth(it, selectedMonth, hemi)}
              onToggleCatch={(name) => toggleCatch(name)}
            />
          )}
        </>
      )}
    </div>
  );
}
