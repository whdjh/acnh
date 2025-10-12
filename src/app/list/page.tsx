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

// src/app/list/page.tsx (ListPageInner 안)

function ListPageInner() {
  const { activeTab, setTab } = useQueryTab<Category>("tab", "fish", CATEGORY_TABS);
  const user = useLocalUser();

  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedHour, setSelectedHour] = useState<number>(new Date().getHours());

  const hemi: "north" | "south" = user?.hemisphere === "south" ? "south" : "north";

  const { items, loading: itemsLoading } = useAcnhItems({
    enabled: !!user,
    category: activeTab,
    hemisphere: hemi,
    month: selectedMonth, // 0이면 전체
  });

  const { caughtSet, toggleCatch, loading: caughtLoading } = useCaughtItems({
    enabled: !!user,
    userId: user?.id,
    category: activeTab,
  });

  const loading = itemsLoading || caughtLoading;
  const isAll = selectedMonth === 0;

  // 필터링 기준 목록(base): 전체모드면 그대로, 월/시 선택 모드면 가용시간 필터 적용
  const base = useMemo(() => {
    return isAll
      ? items
      : items.filter((it: Item) => isAvailableAtHour(it, selectedMonth, selectedHour, hemi));
  }, [items, selectedMonth, selectedHour, hemi, isAll]);

  // 화면에 그릴 목록(정렬만 적용)
  const displayed = useMemo(() => {
    return base
      .slice()
      .sort((a, b) => {
        const aCaught = caughtSet.has(a.originalName) ? 1 : 0;
        const bCaught = caughtSet.has(b.originalName) ? 1 : 0;
        if (aCaught !== bCaught) return aCaught - bCaught; // 미포획 먼저
        return a.name.localeCompare(b.name, "ko");
      });
  }, [base, caughtSet]);

  // ✅ 남은(미포획) 개수: 클릭(토글) 시 즉시 줄어듦
  const remainingCount = useMemo(() => {
    return base.reduce((acc, it) => acc + (caughtSet.has(it.originalName) ? 0 : 1), 0);
  }, [base, caughtSet]);

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
            // ✅ 현재 탭의 ‘미포획’ 개수 표시
            counts={{ [activeTab]: remainingCount }}
          />

          {displayed.length === 0 ? (
            <div className="text-sm text-muted-foreground py-12 text-center">
              해당 조건에 맞는 항목이 없습니다.
            </div>
          ) : (
            <ItemsGrid
              items={displayed}
              caughtSet={caughtSet}
              timesFor={(it) => (isAll ? "" : formatTimesForMonth(it, selectedMonth, hemi))}
              onToggleCatch={(name) => toggleCatch(name)}
            />
          )}
        </>
      )}
    </div>
  );
}
