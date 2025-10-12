"use client";

import { useEffect, useState } from "react";
import useQueryTab from "./hook/useQueryTab";

interface Item {
  name: string; // 한글 이름
  originalName: string; // 영어 이름 (key용)
  image_url: string;
  location?: string;
  sell_nook?: number;
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

  // 유저 로드
  useEffect(() => {
    const u = localStorage.getItem("user");
    if (!u) {
      window.location.href = "/";
      return;
    }
    setUser(JSON.parse(u));
  }, []);

  // 탭 변경 시 데이터 fetch
  useEffect(() => {
    if (!user) return;

    setLoading(true);
    fetch(`/api/nookipedia/${activeTab}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          const formatted = data.data.map((item: any) => ({
            ...item,
            originalName: item.originalName || item.name_en || item.name, // 영어 원본 이름
          }));
          setItems(formatted);

          console.log(`${activeTab} 원본 데이터 ↓`);
          console.log(
            formatted.map((i: any) => ({
              name: i.name,
              location: i.location,
            }))
          );
        } else {
          alert(`데이터 불러오기 실패: ${data.error}`);
        }
      })
      .catch(() => alert("데이터를 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, [activeTab, user]);

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

  if (!user) return null;

  return (
    <div className="p-4">
      <header className="mb-4">
        <h1 className="text-xl font-bold">
          {user.username}님의 {activeTab.toUpperCase()} 도감
        </h1>
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
      </header>

      {loading && <p className="text-sm text-gray-500">불러오는 중...</p>}

      <div className="grid grid-cols-3 gap-3">
        {items.map((item) => (
          <div
            key={item.originalName} // 영어 원본 기준으로 key 고정
            onClick={() => toggleCatch(item.originalName)}
            className={`border rounded p-2 cursor-pointer transition ${caught.has(item.originalName)
                ? "bg-blue-500 border-blue-500"
                : "bg-white border-gray-200 hover:bg-white/10"
              }`}
          >
            <img
              src={item.image_url}
              alt={item.name}
              className={`w-full aspect-square object-contain transition ${caught.has(item.originalName) ? "opacity-70" : ""
                }`}
            />
            <div className="text-center text-sm font-medium mt-1">
              {item.name}
            </div>
            {item.location && (
              <div className="text-center text-xs text-gray-500">
                {item.location}
              </div>
            )}
            {item.sell_nook && (
              <div className="text-center text-xs text-gray-400">
                {item.sell_nook.toLocaleString()} 벨
              </div>
            )}
          </div>

        ))}
      </div>
    </div>
  );
}
