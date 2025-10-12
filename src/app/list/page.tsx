"use client";

import { Suspense, useMemo, useState } from "react";
import useQueryTab from "@/hook/useQueryTab";
import type { Category, Item } from "@/types/acnh";
import { isAvailableAtHour, formatTimesForMonth } from "@/lib/time";

import { useLocalUser } from "@/hook/useLocalUser";
import { useCaughtItems } from "@/hook/useCaughtItems";
import { useAcnhItems } from "@/hook/useAcnhItems";

import ListHeader from "@/components/list/ListHeader";
import ItemsGrid from "@/components/list/ItemsGrid";
import ItemsGridSkeleton from "@/components/list/ItemsGridSkeleton";
import ListHeaderSkeleton from "@/components/list/ListHeaderSkeleton";

// 이 페이지는 동적으로 렌더링 (프리렌더 에러 회피)
export const dynamic = "force-dynamic";

const CATEGORY_TABS: Category[] = ["fish", "bug", "sea", "fossil"];

function ListPageFallback() {
  return (
    <div className="p-4">
      <ListHeaderSkeleton />
      <ItemsGridSkeleton count={9} />
    </div>
  );
}

export default function ListPage() {
  return (
    <Suspense fallback={<ListPageFallback />}>
      <ListPageInner />
    </Suspense>
  );
}

function ListPageInner() {
  // 쿼리탭: ?tab=fish|bug|sea|fossil
  const { activeTab, setTab } = useQueryTab<Category>("tab", "fish", CATEGORY_TABS);

  const user = useLocalUser();

  // 선택 월/시간
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedHour, setSelectedHour] = useState<number>(new Date().getHours());

  const hemi: "north" | "south" = user?.hemisphere === "south" ? "south" : "north";

  // /api/items 사용: 월이 0이면 전체를 가져옴
  const { items, loading: itemsLoading } = useAcnhItems({
    enabled: !!user,
    category: activeTab,
    hemisphere: hemi,
    month: selectedMonth, // 0이면 훅이 전체 모드로 요청
  });

  const { caughtSet, toggleCatch, loading: caughtLoading } = useCaughtItems({
    enabled: !!user,
    userId: user?.id,
    category: activeTab,
  });

  const loading = itemsLoading || caughtLoading;

  const isAll = selectedMonth === 0;

  const displayed = useMemo(() => {
    // ✅ 전체 모드(0)면 시간/월 필터를 적용하지 않고 정렬만
    const base = isAll
      ? items
      : items.filter((it: Item) => isAvailableAtHour(it, selectedMonth, selectedHour, hemi));

    return base
      .slice()
      .sort((a, b) => {
        const aCaught = caughtSet.has(a.originalName) ? 1 : 0;
        const bCaught = caughtSet.has(b.originalName) ? 1 : 0;
        if (aCaught !== bCaught) return aCaught - bCaught;
        return a.name.localeCompare(b.name, "ko");
      });
  }, [items, caughtSet, selectedMonth, selectedHour, hemi, isAll]);

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
              counts={{ [activeTab]: displayed.length }}

          />

          {displayed.length === 0 ? (
            <div className="text-sm text-muted-foreground py-12 text-center">
              해당 조건에 맞는 항목이 없습니다.
            </div>
          ) : (
            <ItemsGrid
              items={displayed}
              caughtSet={caughtSet}
              timesFor={(it) =>
                isAll ? "" : formatTimesForMonth(it, selectedMonth, hemi)
              }
              onToggleCatch={(name) => toggleCatch(name)}
            />
          )}
        </>
      )}
    </div>
  );
}
