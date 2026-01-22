// 시간 파싱/포맷/필터 유틸

import type { Item, TimesByMonthValue } from "@/types/acnh";

/**
 * 시계 형식 문자열을 24시간 형식 숫자로 변환합니다.
 * 
 * @param s - 시계 형식 문자열 (예: "4 AM", "9 PM", "12:00 PM")
 * @returns 0~23 사이의 시간 값, 파싱 실패 시 null
 * @example
 * parseClockToHour("4 AM") → 4
 * parseClockToHour("9 PM") → 21
 * parseClockToHour("all day") → null
 */
export function parseClockToHour(s: string): number | null {
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

/**
 * 시작 시간과 종료 시간 사이의 모든 시간을 배열로 반환합니다.
 * 자정을 넘어가는 경우(예: 22시~2시)도 처리합니다.
 * 
 * @param startStr - 시작 시간 문자열
 * @param endStr - 종료 시간 문자열
 * @returns 해당 시간대의 시간 배열 (0~23)
 * @example
 * rangeToHours("4 AM", "9 PM") → [4, 5, ..., 21]
 * rangeToHours("10 PM", "2 AM") → [22, 23, 0, 1, 2]
 */
export function rangeToHours(startStr: string, endStr: string): number[] {
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

/**
 * 시간 문자열을 시간 Set으로 변환합니다.
 * 
 * 다양한 형식을 지원합니다:
 * - "All day" → 모든 시간 (0~23)
 * - "4 AM – 9 PM" → [4, 5, ..., 21]
 * - "4 AM, 9 PM" → [4, 21]
 * - "4 AM/9 PM" → [4, 21]
 * 
 * @param val - 시간 문자열
 * @returns 시간 Set (0~23)
 */
export function stringTimesToHourSet(val: string): Set<number> {
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

/**
 * 다양한 형식의 시간 값을 시간 Set으로 정규화합니다.
 * 
 * 지원하는 형식:
 * - 문자열: "4 AM – 9 PM"
 * - boolean 배열 (24개): [true, false, ...]
 * - number 배열: [4, 5, 6, ...]
 * - 객체 배열: [{ start: "4 AM", end: "9 PM" }, ...]
 * 
 * @param val - 정규화할 시간 값
 * @returns 시간 Set (0~23)
 */
export function normalizeTimesToHourSet(val: TimesByMonthValue): Set<number> {
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

/**
 * 특정 월과 시간에 아이템이 잡히는지 확인합니다.
 * 
 * @param item - 아이템 객체
 * @param month - 월 (1~12)
 * @param hour - 시간 (0~23)
 * @param hemi - 반구 ("north" | "south")
 * @returns 해당 시간에 잡을 수 있는지 여부
 */
export function isAvailableAtHour(item: Item, month: number, hour: number, hemi: "north" | "south"): boolean {
  const key = String(month);
  const hemiTimes =
    (hemi === "north" ? item.north_times_by_month?.[key] : item.south_times_by_month?.[key]);
  const commonTimes = item.times_by_month?.[key];
  const val = hemiTimes ?? commonTimes;
  if (val == null) return false;
  const hourSet = normalizeTimesToHourSet(val);
  return hourSet.has(hour);
}

/**
 * 시간 배열을 압축된 문자열 형식으로 변환합니다.
 * 
 * @param hours - 시간 배열 (0~23)
 * @returns 압축된 시간 문자열
 * @example
 * compressHourList([4, 5, 6, 7, 8]) → "04–08시"
 * compressHourList([0, 1, 2, ..., 23]) → "종일"
 * compressHourList([4, 6, 8]) → "04시, 06시, 08시"
 */
export function compressHourList(hours: number[]): string {
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

/**
 * 아이템의 특정 월 시간 정보를 포맷된 문자열로 반환합니다.
 * 
 * @param item - 아이템 객체
 * @param month - 월 (1~12)
 * @param hemi - 반구 ("north" | "south")
 * @returns 포맷된 시간 문자열 (예: "04–21시", "종일", "정보 없음")
 */
export function formatTimesForMonth(item: Item, month: number, hemi: "north" | "south"): string {
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
            ? `${String(sh).padStart(2, "0")}–${String(eh).padStart(2, "0")}시`
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
