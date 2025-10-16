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

// 가격 정렬 키
type SortKey = "priceDesc" | "priceAsc";

// 서식지(물고기 전용)
// - pond(연못)
// - river(강 일반)
// - clifftop(절벽 위 강)
// - riverMouth(강 하구)
// - pier(부두)
// - sea(바다)
export type Habitat =
  | "all"
  | "pond"
  | "river"
  | "clifftop"
  | "riverMouth"
  | "pier"
  | "sea";

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
  const { activeTab, setTab } = useQueryTab<Category>("tab", "fish", CATEGORY_TABS);
  const user = useLocalUser();

  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedHour, setSelectedHour] = useState<number>(new Date().getHours());
  const [search, setSearch] = useState<string>("");
  const [sort, setSort] = useState<SortKey>("priceDesc");

  // 물고기 탭 전용 서식지 필터 (기본: 전체)
  const [habitat, setHabitat] = useState<Habitat>("all");

  const hemi: "north" | "south" = user?.hemisphere === "south" ? "south" : "north";

  const { items, loading: itemsLoading } = useAcnhItems({
    enabled: !!user,
    category: activeTab,
    hemisphere: hemi,
    month: selectedMonth,
  });

  const { caughtSet, toggleCatch, loading: caughtLoading } = useCaughtItems({
    enabled: !!user,
    userId: user?.id,
    category: activeTab,
  });

  const loading = itemsLoading || caughtLoading;
  const isAll = selectedMonth === 0;

  // location 원문을 상위 6분류로 매핑
  const simpleHabitat = (loc?: string | null): Habitat => {
    if (!loc) return "all";
    const s = loc.toLowerCase();

    // 부두
    if (s.includes("pier") || s.includes("부두")) return "pier";

    // 절벽 위 강
    if (s.includes("clifftop") || s.includes("절벽")) return "clifftop";

    // 강(하구)
    if (s.includes("mouth") || s.includes("하구")) return "riverMouth";

    // 바다
    if (s.includes("sea") || s.includes("ocean") || s.includes("beach") || s.includes("바다"))
      return "sea";

    // 연못/호수
    if (s.includes("pond") || s.includes("lake") || s.includes("연못") || s.includes("호수"))
      return "pond";

    // 강(일반)
    if (s.includes("river") || s.includes("강")) return "river";

    return "all";
  };

  // 1차: 월/시간 필터
  const base = useMemo(() => {
    return isAll
      ? items
      : items.filter((it: Item) => isAvailableAtHour(it, selectedMonth, selectedHour, hemi));
  }, [items, selectedMonth, selectedHour, hemi, isAll]);

  // 2차: (물고기 탭 한정) 서식지 필터
  const baseWithHabitat = useMemo(() => {
    if (!base) return [];
    if (activeTab !== "fish" || habitat === "all") return base;
    return base.filter((it: Item) => simpleHabitat(it.location) === habitat);
  }, [base, activeTab, habitat]);

  // 이름만 검색
  const matchesQuery = (it: Item, q: string) => {
    if (!q) return true;
    const needle = q.trim().toLocaleLowerCase("ko-KR");
    const hay = [it.name, it.originalName].join(" ").toLocaleLowerCase("ko-KR");
    return hay.includes(needle);
  };

  // 3차: 검색 필터
  const filtered = useMemo(() => {
    if (!baseWithHabitat) return [];
    return baseWithHabitat.filter((it: Item) => matchesQuery(it, search));
  }, [baseWithHabitat, search]);

  // 4차: 정렬 – 미포획 그룹 먼저, 같은 그룹 내부에서 가격만 정렬
  const displayed = useMemo(() => {
    const nameAsc = (a: Item, b: Item) => a.name.localeCompare(b.name, "ko");
    const price = (x: Item) => (typeof x.sell_nook === "number" ? x.sell_nook : null);

    const arr = filtered.slice();

    return arr.sort((a, b) => {
      const aGroup = caughtSet.has(a.originalName) ? 1 : 0; // 0 미포획, 1 포획
      const bGroup = caughtSet.has(b.originalName) ? 1 : 0;
      if (aGroup !== bGroup) return aGroup - bGroup;

      const pa = price(a);
      const pb = price(b);

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

  // 남은(미포획) 개수 – 현재 필터(월/시간/서식지/검색) 반영
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
            onChangeTab={(t) => {
              setTab(t);
              // 물고기 외 탭으로 넘어갈 때 의미 없으므로 리셋
              setHabitat("all");
            }}
            selectedMonth={selectedMonth}
            onChangeMonth={setSelectedMonth}
            selectedHour={selectedHour}
            onChangeHour={setSelectedHour}
            counts={{ [activeTab]: remainingCount }}
            // 검색
            searchTerm={search}
            onChangeSearch={setSearch}
            // 정렬
            sort={sort}
            onChangeSort={setSort}
            // 서식지 (물고기 전용)
            habitat={habitat}
            onChangeHabitat={setHabitat}
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
