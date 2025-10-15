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

// 동적 렌더링 (프리렌더 에러 회피)
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

// 가격 정렬 키. 기본값을 '가격 높은 순'으로 설정한다.
type SortKey = "priceDesc" | "priceAsc";

function ListPageInner() {
  const { activeTab, setTab } = useQueryTab<Category>("tab", "fish", CATEGORY_TABS);
  const user = useLocalUser();

  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedHour, setSelectedHour] = useState<number>(new Date().getHours());
  const [search, setSearch] = useState<string>("");
  const [sort, setSort] = useState<SortKey>("priceDesc"); // 가격 높은 순을 기본으로

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

  // 월/시간 필터
  const base = useMemo(() => {
    return isAll
      ? items
      : items.filter((it: Item) => isAvailableAtHour(it, selectedMonth, selectedHour, hemi));
  }, [items, selectedMonth, selectedHour, hemi, isAll]);

  // 이름만 검색
  const matchesQuery = (it: Item, q: string) => {
    if (!q) return true;
    const needle = q.trim().toLocaleLowerCase("ko-KR");
    const hay = [it.name, it.originalName].join(" ").toLocaleLowerCase("ko-KR");
    return hay.includes(needle);
  };

  const filtered = useMemo(() => {
    if (!base) return [];
    return base.filter((it: Item) => matchesQuery(it, search));
  }, [base, search]);

  // 정렬: 미포획 먼저, 포획은 아래로 고정한다.
  // 각 그룹 내부에서만 가격 정렬을 적용한다.
  // - priceDesc: 가격 높은 순
  // - priceAsc: 가격 낮은 순
  // 가격이 없는 항목은 각 그룹의 맨 뒤로 보낸다. 동가에는 이름 오름차순을 사용한다.
  const displayed = useMemo(() => {
    const nameAsc = (a: Item, b: Item) => a.name.localeCompare(b.name, "ko");
    const price = (x: Item) => (typeof x.sell_nook === "number" ? x.sell_nook : null);

    const arr = filtered.slice();

    return arr.sort((a, b) => {
      const aGroup = caughtSet.has(a.originalName) ? 1 : 0; // 0: 미포획, 1: 포획
      const bGroup = caughtSet.has(b.originalName) ? 1 : 0;

      // 그룹 우선: 미포획(0)이 먼저, 포획(1)이 나중
      if (aGroup !== bGroup) return aGroup - bGroup;

      // 같은 그룹 안에서는 가격 정렬
      const pa = price(a);
      const pb = price(b);

      // 가격 미존재는 같은 그룹의 맨 뒤
      if (pa == null && pb == null) return nameAsc(a, b);
      if (pa == null) return 1;
      if (pb == null) return -1;

      if (sort === "priceAsc") {
        if (pa !== pb) return pa - pb;
        return nameAsc(a, b);
      } else {
        if (pa !== pb) return pb - pa;
        return nameAsc(a, b);
      }
    });
  }, [filtered, caughtSet, sort]);

  // 남은(미포획) 개수: 검색 결과 기준
  const remainingCount = useMemo(() => {
    return filtered.reduce((acc, it) => acc + (caughtSet.has(it.originalName) ? 0 : 1), 0);
  }, [filtered, caughtSet]);

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
            counts={{ [activeTab]: remainingCount }}
            // 검색 props
            searchTerm={search}
            onChangeSearch={setSearch}
            // 정렬 드롭다운 props
            sort={sort}
            onChangeSort={setSort}
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
