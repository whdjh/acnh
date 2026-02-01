"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import type { Category, Habitat, Hemisphere } from "@/types/acnh";

/**
 * 리스트 헤더 컴포넌트의 Props
 */
interface ListHeaderProps {
  username: string;
  hemisphere: Hemisphere;
  tabs: Category[];
  activeTab: Category;
  onChangeTab: (t: Category) => void;
  selectedMonth: number;
  onChangeMonth: (m: number) => void;
  selectedHour: number;
  onChangeHour: (h: number) => void;
  counts?: Partial<Record<Category, number>>;
  searchTerm: string;
  onChangeSearch: (v: string) => void;
  sort: "priceDesc" | "priceAsc";
  onChangeSort: (v: "priceDesc" | "priceAsc") => void;

  /** 물고기 전용 서식지 필터 (물고기 카테고리에서만 사용) */
  habitat: Habitat;
  /** 서식지 변경 핸들러 */
  onChangeHabitat: (v: Habitat) => void;
}

/**
 * 리스트 페이지 헤더 컴포넌트
 * 
 * 아이템 목록을 필터링하고 정렬하기 위한 UI를 제공합니다.
 * - 사용자 이름 및 반구 표시
 * - 이름 검색
 * - 월/시간 필터
 * - 가격 정렬
 * - 카테고리 탭 (물고기/곤충/해양생물/화석)
 * - 물고기 전용 서식지 필터
 * 
 * @param props - ListHeaderProps
 */
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
  return (
    <header className="mb-4">
      {/* 첫 줄: 제목 + 반구 배지 */}
      <div className="mb-2">
        <h1 className="text-xl font-bold flex items-center gap-2">
          {username}님의{" "}
          {activeTab === "fish"
            ? "물고기"
            : activeTab === "bug"
              ? "곤충"
              : activeTab === "sea"
                ? "해양생물"
                : "화석"}{" "}
          도감
          <span className="text-xs font-semibold inline">
            {hemisphere === "north" ? "북반구" : "남반구"}
          </span>
        </h1>
      </div>

      {/* 두 번째 줄: 이름 검색 전용 */}
      <div className="mb-2">
        <div className="relative w-full sm:w-[420px] md:w-[520px]">
          <Input
            value={searchTerm}
            onChange={(e) => onChangeSearch(e.target.value)}
            placeholder="이름으로 검색…"
            className="h-8 text-sm pr-8"
          />
          {searchTerm && (
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => onChangeSearch("")}
              aria-label="검색어 지우기"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* 세 번째 줄: 월/시간/정렬 */}
      <div className="flex flex-wrap items-center gap-2 mb-2">
        {/* 월 */}
        <Select
          value={String(selectedMonth)}
          onValueChange={(v) => onChangeMonth(parseInt(v, 10))}
        >
          <SelectTrigger className="h-8 text-sm min-w-[88px]" aria-label="월 선택">
            <SelectValue placeholder="월" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">전체</SelectItem>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <SelectItem key={m} value={String(m)}>
                {m}월
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* 시간 */}
        <Select
          value={String(selectedHour)}
          onValueChange={(v) => onChangeHour(parseInt(v, 10))}
        >
          <SelectTrigger className="h-8 text-sm min-w-[88px]" aria-label="시간 선택">
            <SelectValue placeholder="시간" />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            {Array.from({ length: 24 }, (_, h) => h).map((h) => (
              <SelectItem key={h} value={String(h)}>
                {String(h).padStart(2, "0")}시
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* 정렬 */}
        <Select value={sort} onValueChange={(v) => onChangeSort(v as "priceDesc" | "priceAsc")}>
          <SelectTrigger className="h-8 text-sm min-w-[132px]" aria-label="정렬">
            <SelectValue placeholder="정렬" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="priceDesc">가격 높은 순</SelectItem>
            <SelectItem value="priceAsc">가격 낮은 순</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 네 번째 줄: 상단 탭(물고기/곤충/해양생물/화석) */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map((tab) => {
          const selected = activeTab === tab;
          const label =
            tab === "fish" ? "물고기" : tab === "bug" ? "곤충" : tab === "sea" ? "해양생물" : "화석";
          const count = counts?.[tab];

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
                  aria-label={`${label} 개수 ${count}`}
                >
                  {count}
                </span>
              )}
            </Button>
          );
        })}
      </div>

      {/* 마지막 줄: 물고기 전용 서식지 토글 – 6분류(연못/강/절벽/하구/부두/바다) */}
      {activeTab === "fish" && (
        <div className="flex flex-wrap mt-3 items-center gap-2 mb-2">
          {[
            { key: "all", label: "전체" },
            { key: "pond", label: "연못" },
            { key: "river", label: "강" },
            { key: "clifftop", label: "강(절벽 위)" },
            { key: "riverMouth", label: "강(하구)" },
            { key: "pier", label: "부두" },
            { key: "sea", label: "바다" },
          ].map(({ key, label }) => {
            const selected = habitat === (key as Habitat);
            return (
              <Button
                key={key}
                variant={selected ? "default" : "outline"}
                size="sm"
                onClick={() => onChangeHabitat(key as Habitat)}
              >
                {label}
              </Button>
            );
          })}
        </div>
      )}
    </header>
  );
}
