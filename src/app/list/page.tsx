"use client";

import { useEffect, useMemo, useState } from "react";
import useQueryTab from "./hook/useQueryTab";

// --- 타입들 ---
interface HemisphereMonths { months_array: number[] } // 1~12
type Category = "fish" | "bug" | "sea" | "fossil";

type TimesByMonthValue =
  | string
  | number[]
  | boolean[]
  | { start: string; end: string }[]
  | null
  | undefined;

interface Item {
  name: string;
  originalName: string;
  image_url: string;
  location?: string;
  sell_nook?: number;

  north: HemisphereMonths;
  south: HemisphereMonths;

  times_by_month?: Record<string, TimesByMonthValue>;
  north_times_by_month?: Record<string, TimesByMonthValue>;
  south_times_by_month?: Record<string, TimesByMonthValue>;
}

// --- 상수 ---
const CATEGORY_TABS: Category[] = ["fish", "bug", "sea", "fossil"];

// --- 시간 파싱 유틸 ---
function parseClockToHour(s: string): number | null {
  const str = s.trim().toLowerCase();
  if (str.includes("all")) return null;
  const m = str.match(/^(\d{1,2})(?::(\d{1,2}))?\s*(am|pm)?$/i);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const ampm = (m[3] || "").toLowerCase();
  if (ampm === "am") { if (h === 12) h = 0; }
  else if (ampm === "pm") { if (h !== 12) h += 12; }
  return (h >= 0 && h <= 23) ? h : null;
}

function rangeToHours(startStr: string, endStr: string): number[] {
  const sh = parseClockToHour(startStr);
  const eh = parseClockToHour(endStr);
  if (sh === null || eh === null) return [];
  const hours: number[] = [];
  if (sh <= eh) {
    for (let h = sh; h <= eh; h++) hours.push(h);
  } else {
    for (let h = sh; h <= 23; h++) hours.push(h);
    for (let h = 0; h <= eh; h++) hours.push(h);
  }
  return hours;
}

function stringTimesToHourSet(val: string): Set<number> {
  const s = val.trim().toLowerCase();
  if (!s || s.includes("all")) return new Set([...Array(24).keys()]);
  const parts = s.split(/[,/&;]+/).map((p) => p.trim()).filter(Boolean);
  const hours: number[] = [];
  for (const part of parts) {
    const mm = part.split(/-|–|—/).map((x) => x.trim());
    if (mm.length === 2) hours.push(...rangeToHours(mm[0], mm[1]));
    else {
      const h = parseClockToHour(part);
      if (h !== null) hours.push(h);
    }
  }
  return new Set(hours);
}

function normalizeTimesToHourSet(val: TimesByMonthValue): Set<number> {
  if (val == null) return new Set();
  if (typeof val === "string") return stringTimesToHourSet(val);

  if (Array.isArray(val)) {
    if (val.length === 24 && typeof val[0] === "boolean") {
      const hours: number[] = [];
      (val as boolean[]).forEach((ok, h) => { if (ok) hours.push(h); });
      return new Set(hours);
    }
    if (val.length > 0 && typeof val[0] === "number") {
      return new Set(val as number[]);
    }
  }

  if (Array.isArray(val) && typeof val[0] === "object" && val[0] != null) {
    const hours: number[] = [];
    for (const r of val as { start: string; end: string }[]) {
      if (!r?.start || !r?.end) continue;
      hours.push(...rangeToHours(r.start, r.end));
    }
    return new Set(hours);
  }
  return new Set();
}

function isAvailableAtHour(item: Item, month: number, hour: number, hemi: "north" | "south"): boolean {
  const key = String(month);
  const hemiTimes =
    (hemi === "north" ? item.north_times_by_month?.[key] : item.south_times_by_month?.[key]);
  const commonTimes = item.times_by_month?.[key];
  const val = hemiTimes ?? commonTimes;
  if (val == null) return false;
  const hourSet = normalizeTimesToHourSet(val);
  return hourSet.has(hour);
}

// --- 표시용 ---
function compressHourList(hours: number[]): string {
  const uniq = Array.from(new Set(hours)).sort((a, b) => a - b);
  if (uniq.length === 24) return "종일";
  if (uniq.length === 0) return "없음";

  const ranges: Array<[number, number]> = [];
  let s = uniq[0], prev = uniq[0];
  for (let i = 1; i < uniq.length; i++) {
    const h = uniq[i];
    if (h === prev + 1) { prev = h; continue; }
    ranges.push([s, prev]);
    s = prev = h;
  }
  ranges.push([s, prev]);

  return ranges
    .map(([a, b]) => a === b
      ? `${String(a).padStart(2, "0")}시`
      : `${String(a).padStart(2, "0")}–${String(b).padStart(2, "0")}시`)
    .join(", ");
}

function formatTimesForMonth(item: Item, month: number, hemi: "north" | "south"): string {
  const key = String(month);
  const val =
    (hemi === "north" ? item.north_times_by_month?.[key] : item.south_times_by_month?.[key]) ??
    item.times_by_month?.[key];

  if (val == null) return "정보 없음";

  if (typeof val === "string") {
    const s = val.trim();
    if (!s) return "정보 없음";
    if (/all\s*day/i.test(s)) return "종일";

    const segs = s
      .toLowerCase()
      .split(/[,/&;]+/)
      .map((seg) => seg.trim())
      .filter(Boolean)
      .map((seg) => {
        const [a, b] = seg.split(/-|–|—/).map((x) => x.trim());
        const to24 = (t: string) => {
          const m = t.match(/^(\d{1,2})(?::\d{1,2})?\s*(am|pm)?$/i);
          if (!m) return null;
          let h = parseInt(m[1], 10);
          const ampm = (m[2] || "").toLowerCase();
          if (ampm === "am") { if (h === 12) h = 0; }
          else if (ampm === "pm") { if (h !== 12) h += 12; }
          return (h >= 0 && h <= 23) ? h : null;
        };
        if (a && b) {
          const sh = to24(a), eh = to24(b);
          if (sh == null || eh == null) return seg;
          return sh > eh
            ? `${String(sh).padStart(2, "0")}–다음날 ${String(eh).padStart(2, "0")}시`
            : `${String(sh).padStart(2, "0")}–${String(eh).padStart(2, "0")}시`;
        }
        const hh = to24(seg);
        return hh == null ? seg : `${String(hh).padStart(2, "0")}시`;
      });

    return segs.length ? segs.join(", ") : "정보 없음";
  }

  if (Array.isArray(val) && val.length === 24 && typeof val[0] === "boolean") {
    const hours = (val as boolean[]).map((ok, h) => (ok ? h : null)).filter((h) => h !== null) as number[];
    return compressHourList(hours);
  }

  if (Array.isArray(val) && val.length > 0 && typeof val[0] === "number") {
    const hours = (val as number[]).filter((h) => h >= 0 && h <= 23);
    return compressHourList(hours);
  }

  if (Array.isArray(val) && val.length > 0 && typeof val[0] === "object") {
    const parts = (val as Array<{ start: string; end: string }>).map(r => `${r.start}–${r.end}`);
    return parts.length ? parts.join(", ") : "정보 없음";
  }

  return "정보 없음";
}

// --- 컴포넌트 ---
export default function ListPage() {
  const { activeTab, setTab } = useQueryTab<Category>("tab", "fish", CATEGORY_TABS);

  const [user, setUser] = useState<any>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [caught, setCaught] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  // 사용자가 선택하는 월/시간
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedHour, setSelectedHour] = useState<number>(new Date().getHours());

  // user 로드
  useEffect(() => {
    const u = localStorage.getItem("user");
    if (!u) { window.location.href = "/"; return; }
    setUser(JSON.parse(u));
  }, []);

  // 잡은 목록 GET
  useEffect(() => {
    if (!user) return;
    const uid = Number(user.id);
    if (!Number.isFinite(uid)) return;

    const params = new URLSearchParams({
      userId: String(uid),
      category: activeTab,
      _t: String(Date.now()),
    });

    fetch(`/api/caught?${params.toString()}`, { cache: "no-store" })
      .then(async (res) => {
        const ct = res.headers.get("content-type") || "";
        if (!ct.includes("application/json")) throw new Error("Expected JSON");
        return res.json();
      })
      .then((data) => setCaught(new Set<string>(data.items ?? [])))
      .catch((e) => {
        console.error("GET /api/caught failed:", e);
        setCaught(new Set());
      });
  }, [user, activeTab]);

  // 월/탭에 맞는 아이템 목록 GET
  useEffect(() => {
    if (!user) return;
    setLoading(true);

    const params = new URLSearchParams({
      month: String(selectedMonth),
      hemi: user.hemisphere === "south" ? "south" : "north",
      only: "1",
      _t: String(Date.now()),
    });

    fetch(`/api/nookipedia/${activeTab}?${params.toString()}`, { cache: "no-store" })
      .then(async (res) => {
        const ct = res.headers.get("content-type") || "";
        if (!ct.includes("application/json")) throw new Error("Expected JSON");
        return res.json();
      })
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

  // 토글 (낙관적 업데이트 + 실패 롤백)
  async function toggleCatch(itemName: string) {
    if (!user) return;
    const uid = Number(user.id);
    if (!Number.isFinite(uid)) return;

    const optimistic = new Set(caught);
    const wasCaught = optimistic.has(itemName);
    if (wasCaught) optimistic.delete(itemName);
    else optimistic.add(itemName);
    setCaught(optimistic);

    try {
      const res = await fetch("/api/caught/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          userId: uid,
          category: activeTab,
          itemName,
          _t: Date.now(),
        }),
      });
      const ct = res.headers.get("content-type") || "";
      if (!ct.includes("application/json")) throw new Error("Expected JSON");
      const data = await res.json();
      setCaught((prev) => {
        const next = new Set(prev);
        if (data.caught) next.add(itemName);
        else next.delete(itemName);
        return next;
      });
    } catch (e) {
      console.error("POST /api/caught/toggle failed:", e);
      setCaught((prev) => {
        const next = new Set(prev);
        if (wasCaught) next.add(itemName);
        else next.delete(itemName);
        return next;
      });
      alert("상태 변경에 실패했습니다.");
    }
  }

  // 필터/정렬
  const hemi: "north" | "south" = (user?.hemisphere === "south" ? "south" : "north");

  const displayedItems = useMemo(() => {
    const base = items.filter((it) => isAvailableAtHour(it, selectedMonth, selectedHour, hemi));
    const list = [...base];
    list.sort((a, b) => {
      const aCaught = caught.has(a.originalName) ? 1 : 0;
      const bCaught = caught.has(b.originalName) ? 1 : 0;
      if (aCaught !== bCaught) return aCaught - bCaught;
      return a.name.localeCompare(b.name, "ko");
    });
    return list;
  }, [items, caught, selectedHour, hemi, selectedMonth]);

  if (!user) return null;

  return (
    <div className="p-4">
      <header className="mb-4">
        <div className="flex flex-wrap items-center gap-4 mb-2">
          <h1 className="text-xl font-bold">
            {user.username}님의{" "}
            {activeTab === "fish" ? "물고기" :
              activeTab === "bug" ? "곤충" :
                activeTab === "sea" ? "해양생물" : "화석"} 도감
          </h1>
          <span className="text-sm">{hemi === "north" ? "북반구" : "남반구"}</span>

          {/* 오른쪽 컨트롤 */}
          <div className="flex items-center gap-3 ml-auto">
            {/* 월 선택 */}
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="border px-2 py-1 rounded"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option value={m} key={m}>{m}월</option>
                ))}
              </select>

            {/* 시간 선택 */}
              <select
                value={selectedHour}
                onChange={(e) => setSelectedHour(Number(e.target.value))}
                className="border px-2 py-1 rounded"
              >
                {Array.from({ length: 24 }, (_, h) => h).map((h) => (
                  <option key={h} value={h}>{String(h).padStart(2, "0")}시</option>
                ))}
              </select>
          </div>
        </div>

        <div className="flex gap-2 mt-3">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setTab(tab)}
              className={`border px-3 py-1 rounded ${activeTab === tab ? "bg-blue-600 text-white" : "bg-white"}`}
            >
              {tab === "fish" ? "물고기" : tab === "bug" ? "곤충" : tab === "sea" ? "해양생물" : "화석"}
            </button>
          ))}
        </div>
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
          const timesText = formatTimesForMonth(item, selectedMonth, hemi);

          return (
            <div
              key={item.originalName}
              onClick={() => toggleCatch(item.originalName)}
              className={`border rounded p-2 cursor-pointer transition ${isCaught ? "bg-blue-500 border-blue-500" : "bg-white border-gray-200 hover:bg-white/10"
                }`}
              title={item.originalName}
            >
              <img
                src={item.image_url}
                alt={item.name}
                className={`w-full aspect-square object-contain transition ${isCaught ? "opacity-70" : ""}`}
                loading="lazy"
              />
              <div className="text-center text-sm font-medium mt-1">{item.name}</div>

              {item.location && (
                <div className="text-center text-xs text-gray-500">{item.location}</div>
              )}
              {typeof item.sell_nook === "number" && (
                <div className="text-center text-xs text-gray-400">
                  {item.sell_nook.toLocaleString()} 벨
                </div>
              )}

              {/* 시간 요약 + 필터 기준 */}
              <div className="mt-1 text-center">
                <div className="text-[11px] text-gray-700">
                  시간: {timesText}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
