// app/list/page.tsx
"use client";

import { Suspense, useMemo, useState } from "react";
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

// 이 페이지는 동적으로 렌더링 (프리렌더 에러 회피)
export const dynamic = "force-dynamic";

const CATEGORY_TABS: Category[] = ["fish", "bug", "sea", "fossil"];

// 로딩용 간단한 Fallback
function ListPageFallback() {
  return (
    <div className="p-4">
      <ListHeaderSkeleton />
      <ItemsGridSkeleton count={9} />
    </div>
  );
}

export default function ListPage() {
  // useSearchParams()를 쓰는 훅/컴포넌트를 Suspense로 감싼다
  return (
    <Suspense fallback={<ListPageFallback />}>
      <ListPageInner />
    </Suspense>
  );
}

function ListPageInner() {
  // 여기서 useQueryTab(내부에서 useSearchParams 사용)을 호출해도 OK
  const { activeTab, setTab } = useQueryTab<Category>("tab", "fish", CATEGORY_TABS);

  const user = useLocalUser();

  // 선택 월/시간
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
