"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import type { Category } from "@/types/acnh";

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
}: {
  username: string;
  hemisphere: "north" | "south";
  tabs: Category[];
  activeTab: Category;
  onChangeTab: (t: Category) => void;
  selectedMonth: number;
  onChangeMonth: (m: number) => void;
  selectedHour: number;
  onChangeHour: (h: number) => void;
  counts?: Partial<Record<Category, number>>;
}) {
  return (
    <header className="mb-4">
      <div className="flex flex-wrap items-center gap-4 mb-2">
        <h1 className="text-xl font-bold">
          {username}님의{" "}
          {activeTab === "fish"
            ? "물고기"
            : activeTab === "bug"
              ? "곤충"
              : activeTab === "sea"
                ? "해양생물"
                : "화석"}{" "}
          도감
        </h1>

        <span className="text-sm font-semibold">
          {hemisphere === "north" ? "북반구" : "남반구"}
        </span>

        {/* 오른쪽 컨트롤: 월/시간 */}
        <div className="flex items-center gap-3 ml-auto">
          {/* 월 선택 (0 = 전체) */}
          <Select
            value={String(selectedMonth)}
            onValueChange={(v) => onChangeMonth(parseInt(v, 10))}
          >
            <SelectTrigger className="min-w-[110px]" aria-label="월 선택">
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

          {/* 시간 선택 */}
          <Select
            value={String(selectedHour)}
            onValueChange={(v) => onChangeHour(parseInt(v, 10))}
          >
            <SelectTrigger className="min-w-[110px]" aria-label="시간 선택">
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
        </div>
      </div>

      {/* 탭 버튼 + 개수 뱃지 */}
      <div className="flex gap-2 mt-3">
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
    </header>
  );
}
