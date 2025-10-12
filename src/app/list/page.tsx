"use client";

import { useEffect, useMemo, useState } from "react";
import useQueryTab from "./hook/useQueryTab";

// --- 타입들 ---
interface HemisphereMonths { months_array: number[] } // 1~12
type Category = "fish" | "bug" | "sea" | "fossil";

// API가 주는 times_by_month는 구현마다 포맷이 달 수 있어 범용적으로 처리
type TimesByMonthValue =
  | string                             // "All day" | "4 AM – 9 PM, 7 PM – 4 AM"
  | number[]                           // [0,1,2,...]  (시간 배열)
  | boolean[]                          // 길이 24 (시간별 가능/불가)
  | { start: string; end: string }[]   // [{start:"4 AM", end:"9 PM"}, ...]
  | null
  | undefined;

interface Item {
  name: string;
  originalName: string;
  image_url: string;
  location?: string;
  sell_nook?: number;

  // 반구별 존재 월 정보
  north: HemisphereMonths;
  south: HemisphereMonths;

  // 엔드포인트가 내려주는 시간 정보 (다양한 포맷 고려)
  // 보통은 month 키("1"~"12")별 값이 온다고 가정
  times_by_month?: Record<string, TimesByMonthValue>;

  // 혹시 반구별로 따로 내려주는 구현이라면 아래처럼 들어올 수도 있어서 같이 시도
  // north_times_by_month / south_times_by_month 등도 안전하게 접근
  north_times_by_month?: Record<string, TimesByMonthValue>;
  south_times_by_month?: Record<string, TimesByMonthValue>;
}

// --- 상수/유틸 ---
const CATEGORY_TABS: Category[] = ["fish", "bug", "sea", "fossil"];

// "4 AM" → 4, "9 PM" → 21 같은 형태로 파싱
function parseClockToHour(s: string): number | null {
  const str = s.trim().toLowerCase();
  // "all day" 같은 경우는 별도 처리
  if (str.includes("all")) return null;

  // "4", "4am", "4 am", "04:00", "4:00 am", "16", "16:00" 등
  const m = str.match(/^(\d{1,2})(?::(\d{1,2}))?\s*(am|pm)?$/i);
  if (!m) return null;

  let h = parseInt(m[1], 10);
  const ampm = (m[3] || "").toLowerCase();

  if (ampm === "am") {
    if (h === 12) h = 0;
  } else if (ampm === "pm") {
    if (h !== 12) h += 12;
  }
  // 분 단위는 시간 필터에서는 올림/내림 중 택일 필요. 여기선 “그 시간대 포함”을 위해 분 있으면 그 시간부터 유효로 간주.
  // 시간 단위 필터만 하므로 h만 사용.
  return (h >= 0 && h <= 23) ? h : null;
}

// "4 AM – 9 PM" 같은 범위를 [start..end]의 시간 Set로 변환 (자정 넘김 처리)
function rangeToHours(startStr: string, endStr: string): number[] {
  const sh = parseClockToHour(startStr);
  const eh = parseClockToHour(endStr);
  if (sh === null || eh === null) return [];

  const hours: number[] = [];
  if (sh <= eh) {
    for (let h = sh; h <= eh; h++) hours.push(h);
  } else {
    // 자정 넘어감 (예: 7 PM – 4 AM → 19..23,0..4)
    for (let h = sh; h <= 23; h++) hours.push(h);
    for (let h = 0; h <= eh; h++) hours.push(h);
  }
  return hours;
}

// 문자열 케이스(예: "All day", "4 AM – 9 PM, 7 PM – 4 AM")를 시간 Set로 변환
function stringTimesToHourSet(val: string): Set<number> {
  const s = val.trim().toLowerCase();
  if (!s || s.includes("all")) return new Set([...Array(24).keys()]); // All day

  // 구분자: 콤마/슬래시/세미콜론/앰퍼샌드 등 다양한 케이스 방어
  const parts = s.split(/[,/&;]+/).map((p) => p.trim()).filter(Boolean);
  const hours: number[] = [];

  for (const part of parts) {
    // "4 am – 9 pm" 혹은 "-" "–" 대시 모두 처리
    const mm = part.split(/-|–|—/).map((x) => x.trim());
    if (mm.length === 2) {
      hours.push(...rangeToHours(mm[0], mm[1]));
    } else {
      // 단일 시각이거나 포맷 불명 → 무시
      const h = parseClockToHour(part);
      if (h !== null) hours.push(h);
    }
  }
  return new Set(hours);
}

// 다양한 포맷을 하나의 시간 Set(0~23)로 정규화
function normalizeTimesToHourSet(val: TimesByMonthValue): Set<number> {
  if (val == null) return new Set(); // 정보 없으면 "지금 가능"으로 못 판단 → 빈
  if (typeof val === "string") return stringTimesToHourSet(val);

  if (Array.isArray(val)) {
    if (val.length === 24 && typeof val[0] === "boolean") {
      const hours: number[] = [];
      (val as boolean[]).forEach((ok, h) => { if (ok) hours.push(h) });
      return new Set(hours);
    }
    if (val.length > 0 && typeof val[0] === "number") {
      return new Set(val as number[]);
    }
  }

  if (Array.isArray(val) && typeof val[0] === "object" && val[0] != null) {
    // [{start:"4 AM", end:"9 PM"}, ...]
    const hours: number[] = [];
    for (const r of val as { start: string; end: string }[]) {
      if (!r?.start || !r?.end) continue;
      hours.push(...rangeToHours(r.start, r.end));
    }
    return new Set(hours);
  }

  // 알 수 없는 포맷 → 정보 없음 취급
  return new Set();
}

// 아이템이 선택된 월/현재 시각에 잡을 수 있는지 판단
function isAvailableNowByTimes(item: Item, month: number, hourNow: number, hemi: "north" | "south"): boolean {
  // 우선 반구별 times_by_month가 있으면 사용
  const key = String(month);
  const hemiTimes =
    (hemi === "north" ? item.north_times_by_month?.[key] : item.south_times_by_month?.[key]);

  const commonTimes =
    item.times_by_month?.[key];

  const val = hemiTimes ?? commonTimes;
  if (val == null) {
    // 시간 정보가 없으면 “월만 일치하면 보이게” 할지, “숨길지” 결정 필요.
    // 요청은 “잡을 수 있는 것만”이므로, 시간 정보가 없으면 제외.
    return false;
  }

  const hourSet = normalizeTimesToHourSet(val);
  return hourSet.has(hourNow);
}

export default function ListPage() {
  const { activeTab, setTab } = useQueryTab<Category>("tab", "fish", CATEGORY_TABS);

  const [user, setUser] = useState<any>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [caught, setCaught] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  // 현재 시각 & “지금만 보기” 스위치
  const [nowOnly, setNowOnly] = useState<boolean>(true);
  const [now, setNow] = useState<Date>(new Date());

  // 월 선택 (기본: 현재 월)
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);

  // 1분마다 현재 시각 갱신
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

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

  // 월/탭에 맞는 아이템 목록 로드 (only=1 → 월 필터 서버에서 적용 중)
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

  // 정렬: 안 잡은 것 먼저, 이름 오름차순
  const hourNow = now.getHours(); // 로컬(브라우저) 시간
  const hemi: "north" | "south" = (user?.hemisphere === "south" ? "south" : "north");

  const displayedItems = useMemo(() => {
    // 1) 서버에서 이미 month 필터(only=1) 된 목록이 들어옴
    // 2) nowOnly면 현재 시각 가능한 항목만 추가 필터
    const base = nowOnly
      ? items.filter((it) => isAvailableNowByTimes(it, selectedMonth, hourNow, hemi))
      : items;

    const list = [...base];
    list.sort((a, b) => {
      const aCaught = caught.has(a.originalName) ? 1 : 0;
      const bCaught = caught.has(b.originalName) ? 1 : 0;
      if (aCaught !== bCaught) return aCaught - bCaught;
      return a.name.localeCompare(b.name, "ko");
    });
    return list;
  }, [items, caught, nowOnly, hourNow, hemi, selectedMonth]);

  if (!user) return null;

  // 현재 시각 표시 (로컬)
  const timeLabel = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(hourNow).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

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
          <span className="text-sm">{hemi === "north" ? "북반구" : "남반구"}</span>


          {/* 월 선택 */}
          <div className="flex items-center gap-2">
            <div className="text-xs text-gray-600 ml-2">
              현재 시각: {timeLabel}
            </div>
            <div className="flex">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="border px-2 py-1 rounded"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option value={m} key={m}>{m}월</option>
                ))}
              </select>

              {/* 지금만 보기 토글 */}
              <label className="flex items-center gap-1 text-sm text-gray-700 ml-3">
                <input
                  type="checkbox"
                  checked={nowOnly}
                  onChange={(e) => setNowOnly(e.target.checked)}
                />
                실시간
              </label>
            </div>
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

        <p className="mt-2 text-xs text-gray-500">
          {selectedMonth}월 • {displayedItems.length}개 {nowOnly ? "(지금 가능)" : ""}
        </p>
      </header>

      {loading && <p className="text-sm text-gray-500">불러오는 중...</p>}

      {!loading && displayedItems.length === 0 && (
        <div className="text-sm text-gray-500 py-12 text-center">
          {nowOnly ? "지금 잡을 수 있는 항목이 없습니다." : "해당 조건에 맞는 항목이 없습니다."}
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        {displayedItems.map((item) => {
          const isCaught = caught.has(item.originalName);
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
            </div>
          );
        })}
      </div>
    </div>
  );
}
