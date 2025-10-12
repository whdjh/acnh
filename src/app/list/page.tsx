"use client";

import { useEffect, useMemo, useState } from "react";
import useQueryTab from "./hook/useQueryTab";

interface HemisphereMonths {
  months_array: number[]; // 1~12
}
interface Item {
  name: string;         // 한글 이름
  originalName: string; // 영어 이름 (key)
  image_url: string;
  location?: string;
  sell_nook?: number;
  north: HemisphereMonths;
  south: HemisphereMonths;
}

export default function ListPage() {
  const { activeTab, setTab } = useQueryTab("tab", "fish", [
    "fish",
    "bug",
    "sea",
    "fossil",
  ]);

  const [user, setUser] = useState<any>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [caught, setCaught] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  // 월 상태만 유지 (항상 해당 월로 필터)
  const [selectedMonth, setSelectedMonth] = useState<number>(
    new Date().getMonth() + 1
  );

  // 유저 로드
  useEffect(() => {
    const u = localStorage.getItem("user");
    if (!u) {
      window.location.href = "/";
      return;
    }
    setUser(JSON.parse(u));
  }, []);

  // 탭/월 변경 시 서버에서 필터된 데이터 받아오기 (항상 only=1)
  useEffect(() => {
    if (!user) return;

    setLoading(true);

    const params = new URLSearchParams({
      month: String(selectedMonth),
      hemi: user.hemisphere === "south" ? "south" : "north",
      only: "1", // 체크박스 제거: 항상 해당 월만
    });

    fetch(`/api/nookipedia/${activeTab}?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          const formatted: Item[] = data.data.map((item: any) => ({
            ...item,
            originalName: item.originalName || item.name_en || item.name,
          }));
          setItems(formatted);
        } else {
          alert(`데이터 불러오기 실패: ${data.error}`);
        }
      })
      .catch(() => alert("데이터를 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, [activeTab, user, selectedMonth]);

  // 잡은 상태 toggle
  async function toggleCatch(itemName: string) {
    if (!user) return;

    const res = await fetch("/api/caught/toggle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.id,
        category: activeTab,
        itemName,
      }),
    });
    const data = await res.json();

    setCaught((prev) => {
      const next = new Set(prev);
      data.caught ? next.add(itemName) : next.delete(itemName);
      return next;
    });
  }

  // 정렬: 안 잡은 것 먼저, 이름 오름차순
  const displayedItems = useMemo(() => {
    const list = [...items];
    list.sort((a, b) => {
      const aCaught = caught.has(a.originalName) ? 1 : 0;
      const bCaught = caught.has(b.originalName) ? 1 : 0;
      if (aCaught !== bCaught) return aCaught - bCaught;
      return a.name.localeCompare(b.name, "ko");
    });
    return list;
  }, [items, caught]);

  if (!user) return null;

  return (
    <div className="p-4">
      <header className="mb-4">
        <div className="flex flex-wrap items-center gap-5 mb-2">
          <h1 className="text-xl font-bold">
            {user.username}님의{" "}
            {activeTab === "fish"
              ? "물고기"
              : activeTab === "bug"
                ? "곤충"
                : activeTab === "sea"
                  ? "해양생물"
                  : "화석"}{" "}
            도감
          </h1>
          <span className="text-sm">
            {user.hemisphere === "north" ? "북반구" : "남반구"}
          </span>

          {/* 월 선택만 남김 */}
          <div className="flex items-center gap-2 ml-auto">
            <label className="text-sm text-gray-600"></label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="border px-2 py-1 rounded"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option value={m} key={m}>
                  {m}월
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-2 mt-3">
          {["fish", "bug", "sea", "fossil"].map((tab) => (
            <button
              key={tab}
              onClick={() => setTab(tab as any)}
              className={`border px-3 py-1 rounded ${activeTab === tab ? "bg-blue-600 text-white" : "bg-white"
                }`}
            >
              {tab === "fish"
                ? "물고기"
                : tab === "bug"
                  ? "곤충"
                  : tab === "sea"
                    ? "해양생물"
                    : "화석"}
            </button>
          ))}
        </div>

        <p className="mt-2 text-xs text-gray-500">
          {selectedMonth}월 • {displayedItems.length}개
        </p>
      </header>

      {loading && <p className="text-sm text-gray-500">불러오는 중...</p>}

      {!loading && displayedItems.length === 0 && (
        <div className="text-sm text-gray-500 py-12 text-center">
          해당 조건에 맞는 항목이 없습니다.
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        {displayedItems.map((item) => {
          const isCaught = caught.has(item.originalName);
          return (
            <div
              key={item.originalName}
              onClick={() => toggleCatch(item.originalName)}
              className={`border rounded p-2 cursor-pointer transition ${isCaught
                  ? "bg-blue-500 border-blue-500"
                  : "bg-white border-gray-200 hover:bg-white/10"
                }`}
              title={item.originalName}
            >
              <img
                src={item.image_url}
                alt={item.name}
                className={`w-full aspect-square object-contain transition ${isCaught ? "opacity-70" : ""
                  }`}
                loading="lazy"
              />
              <div className="text-center text-sm font-medium mt-1">
                {item.name}
              </div>
              {item.location && (
                <div className="text-center text-xs text-gray-500">
                  {item.location}
                </div>
              )}
              {typeof item.sell_nook === "number" && (
                <div className="text-center text-xs text-gray-400">
                  {item.sell_nook.toLocaleString()} 벨
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
