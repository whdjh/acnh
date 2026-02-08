"use client"

import { useMemo, useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import useQueryTab from "@/hook/useQueryTab"
import type { Category, SortKey, Habitat, Hemisphere } from "@/types/acnh"
import { formatTimesForMonth } from "@/lib/time"

import { useLocalUser } from "@/hook/useLocalUser"
import { useCaughtItems } from "@/hook/useCaughtItems"
import { useAcnhItems } from "@/hook/useAcnhItems"

import ListHeader from "@/components/list/ListHeader"
import ItemsGrid from "@/components/list/ItemsGrid"
import ItemsGridSkeleton from "@/components/list/ItemsGridSkeleton"
import ListHeaderSkeleton from "@/components/list/ListHeaderSkeleton"

const CATEGORY_TABS: Category[] = ["fish", "bug", "sea", "fossil"]

export default function ListPageContent() {
  const t = useTranslations("list")
  const locale = useLocale()
  const { activeTab, setTab } = useQueryTab<Category>("tab", "fish", CATEGORY_TABS)
  const user = useLocalUser()

  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1)
  const [selectedHour, setSelectedHour] = useState<number>(new Date().getHours())
  const [search, setSearch] = useState<string>("")
  const [sort, setSort] = useState<SortKey>("priceDesc")
  const [habitat, setHabitat] = useState<Habitat>("all")

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
    locale,
  })

  const { caughtSet, toggleCatch, loading: caughtLoading } = useCaughtItems({
    enabled: !!user,
    userId: user?.id,
    category: activeTab,
  })

  const loading = itemsLoading || caughtLoading
  const isAll = selectedMonth === 0

  const filtered = items

  const displayed = useMemo(() => {
    const indexed = filtered.map((it, i) => ({ it, i }))
    indexed.sort((a, b) => {
      const aGroup = caughtSet.has(a.it.originalName) ? 1 : 0
      const bGroup = caughtSet.has(b.it.originalName) ? 1 : 0
      if (aGroup !== bGroup) return aGroup - bGroup
      return a.i - b.i
    })
    return indexed.map((x) => x.it)
  }, [filtered, caughtSet])

  const remainingCount = useMemo(() => {
    return filtered.reduce((acc, it) => acc + (caughtSet.has(it.originalName) ? 0 : 1), 0)
  }, [filtered, caughtSet])

  if (loading) {
    return (
      <>
        <ListHeaderSkeleton />
        <ItemsGridSkeleton count={9} />
      </>
    )
  }

  return (
    <>
      <ListHeader
        username={user?.username ?? ""}
        hemisphere={hemi}
        tabs={CATEGORY_TABS}
        activeTab={activeTab}
        onChangeTab={(t) => {
          setTab(t)
          setHabitat("all")
        }}
        selectedMonth={selectedMonth}
        onChangeMonth={setSelectedMonth}
        selectedHour={selectedHour}
        onChangeHour={setSelectedHour}
        counts={{ [activeTab]: remainingCount }}
        searchTerm={search}
        onChangeSearch={setSearch}
        sort={sort}
        onChangeSort={setSort}
        habitat={habitat}
        onChangeHabitat={setHabitat}
      />

      {displayed.length === 0 ? (
        <div className="text-sm text-muted-foreground py-12 text-center">
          {t("noItems")}
        </div>
      ) : (
        <ItemsGrid
          items={displayed}
          caughtSet={caughtSet}
          timesFor={(it) => (isAll ? "" : formatTimesForMonth(it, selectedMonth, hemi, locale))}
          onToggleCatch={(name) => toggleCatch(name)}
        />
      )}
    </>
  )
}
