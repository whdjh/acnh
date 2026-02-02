"use client"

import { Suspense, useMemo, useState } from "react"
import useQueryTab from "@/hook/useQueryTab"
import type { Category, Item, SortKey, Habitat, Hemisphere } from "@/types/acnh"
import { formatTimesForMonth } from "@/lib/time"

import { useLocalUser } from "@/hook/useLocalUser"
import { useCaughtItems } from "@/hook/useCaughtItems"
import { useAcnhItems } from "@/hook/useAcnhItems"

import ListHeader from "@/components/list/ListHeader"
import ItemsGrid from "@/components/list/ItemsGrid"
import ItemsGridSkeleton from "@/components/list/ItemsGridSkeleton"
import ListHeaderSkeleton from "@/components/list/ListHeaderSkeleton"

// 동적 렌더링 (프리렌더 에러 회피)
export const dynamic = "force-dynamic"

const CATEGORY_TABS: Category[] = ["fish", "bug", "sea", "fossil"]

function ListPageFallback() {
  return (
    <div className="p-4">
      <ListHeaderSkeleton />
      <ItemsGridSkeleton count={9} />
    </div>
  )
}

export default function ListPage() {
  return (
    <Suspense fallback={<ListPageFallback />}>
      <ListPageInner />
    </Suspense>
  )
}

function ListPageInner() {
  const { activeTab, setTab } = useQueryTab<Category>("tab", "fish", CATEGORY_TABS)
  const user = useLocalUser()

  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1)
  const [selectedHour, setSelectedHour] = useState<number>(new Date().getHours())
  const [search, setSearch] = useState<string>("")
  const [sort, setSort] = useState<SortKey>("priceDesc")
  const [habitat, setHabitat] = useState<Habitat>("all"); // 물고기 탭 전용 서식지 필터 (기본: 전체)

  const hemi: Hemisphere = user?.hemisphere === "south" ? "south" : "north"

  const { items, loading: itemsLoading } = useAcnhItems({
    enabled: !!user,
    category: activeTab,
    hemisphere: hemi,
    month: selectedMonth,
    hour: selectedHour,
    habitat: activeTab === "fish" ? habitat : undefined,
    search,
    sort,
  })

  const { caughtSet, toggleCatch, loading: caughtLoading } = useCaughtItems({
    enabled: !!user,
    userId: user?.id,
    category: activeTab,
  })

  const loading = itemsLoading || caughtLoading
  const isAll = selectedMonth === 0

  // 서버에서 월/시간/서식지/검색 필터 완료 → items가 곧 filtered
  const filtered = items

  // 정렬 – 미포획 그룹 먼저 (가격 정렬은 서버에서 완료)
  // stable sort를 위해 index 기반으로 같은 그룹 내 순서 유지
  const displayed = useMemo(() => {
    const indexed = filtered.map((it, i) => ({ it, i }))
    indexed.sort((a, b) => {
      const aGroup = caughtSet.has(a.it.originalName) ? 1 : 0; // 0 미포획, 1 포획
      const bGroup = caughtSet.has(b.it.originalName) ? 1 : 0
      if (aGroup !== bGroup) return aGroup - bGroup
      // 같은 그룹: 서버에서 받은 순서(가격 정렬됨) 유지
      return a.i - b.i
    })
    return indexed.map((x) => x.it)
  }, [filtered, caughtSet])

  // 남은(미포획) 개수 – 현재 필터(월/시간/서식지/검색) 반영
  const remainingCount = useMemo(() => {
    return filtered.reduce((acc, it) => acc + (caughtSet.has(it.originalName) ? 0 : 1), 0)
  }, [filtered, caughtSet])

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
            username={user?.username ?? ""}
            hemisphere={hemi}
            tabs={CATEGORY_TABS}
            activeTab={activeTab}
            onChangeTab={(t) => {
              setTab(t)
              setHabitat("all");  // 물고기 외 탭으로 넘어갈 때 의미 없으므로 리셋
            }}
            selectedMonth={selectedMonth}
            onChangeMonth={setSelectedMonth}
            selectedHour={selectedHour}
            onChangeHour={setSelectedHour}
            counts={{ [activeTab]: remainingCount }}
            searchTerm={search} // 검색
            onChangeSearch={setSearch} // 검색
            sort={sort} // 정렬
            onChangeSort={setSort} // 정렬
            habitat={habitat} // 서식지 (물고기 전용)
            onChangeHabitat={setHabitat} // 서식지 (물고기 전용)
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
  )
}
