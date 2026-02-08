"use client"

import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { X } from "lucide-react"
import type { Category, Habitat, Hemisphere } from "@/types/acnh"
import LanguageSwitcher from "@/components/LanguageSwitcher"

interface ListHeaderProps {
  username: string
  hemisphere: Hemisphere
  tabs: Category[]
  activeTab: Category
  onChangeTab: (t: Category) => void
  selectedMonth: number
  onChangeMonth: (m: number) => void
  selectedHour: number
  onChangeHour: (h: number) => void
  counts?: Partial<Record<Category, number>>
  searchTerm: string
  onChangeSearch: (v: string) => void
  sort: "priceDesc" | "priceAsc"
  onChangeSort: (v: "priceDesc" | "priceAsc") => void
  habitat: Habitat
  onChangeHabitat: (v: Habitat) => void
}

export default function ListHeader({
  username,
  hemisphere,
  tabs,
  activeTab,
  onChangeTab,
  selectedMonth,
  onChangeMonth,
  selectedHour,
  onChangeHour,
  counts,
  searchTerm,
  onChangeSearch,
  sort,
  onChangeSort,
  habitat,
  onChangeHabitat,
}: ListHeaderProps) {
  const t = useTranslations("list")
  const tc = useTranslations("common")

  const categoryLabel = (tab: Category) =>
    t(tab === "fish" ? "fish" : tab === "bug" ? "bug" : tab === "sea" ? "sea" : "fossil")

  const habitatItems: { key: Habitat; labelKey: string }[] = [
    { key: "all", labelKey: "habitatAll" },
    { key: "pond", labelKey: "habitatPond" },
    { key: "river", labelKey: "habitatRiver" },
    { key: "clifftop", labelKey: "habitatClifftop" },
    { key: "riverMouth", labelKey: "habitatRiverMouth" },
    { key: "pier", labelKey: "habitatPier" },
    { key: "sea", labelKey: "habitatSea" },
  ]

  return (
    <header className="mb-4">
      {/* 제목 + 반구 배지 + 언어 전환 */}
      <div className="mb-2 flex items-center justify-between">
        <h1 className="text-xl font-bold flex items-center gap-2">
          {t("titlePrefix", { username })}{" "}
          {categoryLabel(activeTab)}{" "}
          {t("catalog")}
          <span className="text-xs font-semibold inline">
            {hemisphere === "north" ? tc("north") : tc("south")}
          </span>
        </h1>
        <LanguageSwitcher />
      </div>

      {/* 이름 검색 */}
      <div className="mb-2">
        <div className="relative w-full sm:w-[420px] md:w-[520px]">
          <Input
            value={searchTerm}
            onChange={(e) => onChangeSearch(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="h-8 text-sm pr-8"
          />
          {searchTerm && (
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => onChangeSearch("")}
              aria-label={t("clearSearch")}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* 월/시간/정렬 */}
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <Select
          value={String(selectedMonth)}
          onValueChange={(v) => onChangeMonth(parseInt(v, 10))}
        >
          <SelectTrigger className="h-8 text-sm min-w-[88px]" aria-label={t("monthSelect")}>
            <SelectValue placeholder={t("monthPlaceholder")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">{t("all")}</SelectItem>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <SelectItem key={m} value={String(m)}>
                {t("monthUnit", { month: m })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={String(selectedHour)}
          onValueChange={(v) => onChangeHour(parseInt(v, 10))}
        >
          <SelectTrigger className="h-8 text-sm min-w-[88px]" aria-label={t("hourSelect")}>
            <SelectValue placeholder={t("hourPlaceholder")} />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            {Array.from({ length: 24 }, (_, h) => h).map((h) => (
              <SelectItem key={h} value={String(h)}>
                {t("hourUnit", { hour: String(h).padStart(2, "0") })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sort} onValueChange={(v) => onChangeSort(v as "priceDesc" | "priceAsc")}>
          <SelectTrigger className="h-8 text-sm min-w-[132px]" aria-label={t("sortSelect")}>
            <SelectValue placeholder={t("sortPlaceholder")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="priceDesc">{t("priceDesc")}</SelectItem>
            <SelectItem value="priceAsc">{t("priceAsc")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 카테고리 탭 */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map((tab) => {
          const selected = activeTab === tab
          const label = categoryLabel(tab)
          const count = counts?.[tab]

          return (
            <Button
              key={tab}
              variant={selected ? "default" : "outline"}
              size="sm"
              onClick={() => onChangeTab(tab)}
              className="flex items-center gap-2"
            >
              <span>{label}</span>
              {typeof count === "number" && (
                <span
                  className={`inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-2 text-xs ${selected ? "bg-black/20 text-white" : "bg-muted text-foreground"
                    }`}
                  aria-label={t("countLabel", { label, count })}
                >
                  {count}
                </span>
              )}
            </Button>
          )
        })}
      </div>

      {/* 물고기 서식지 필터 */}
      {activeTab === "fish" && (
        <div className="flex flex-wrap mt-3 items-center gap-2 mb-2">
          {habitatItems.map(({ key, labelKey }) => {
            const selected = habitat === key
            return (
              <Button
                key={key}
                variant={selected ? "default" : "outline"}
                size="sm"
                onClick={() => onChangeHabitat(key)}
              >
                {t(labelKey)}
              </Button>
            )
          })}
        </div>
      )}
    </header>
  )
}
