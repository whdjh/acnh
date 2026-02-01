// 시간 포맷 유틸

import type { Item } from "@/types/acnh";

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
function compressHourList(hours: number[]): string {
  const uniq = Array.from(new Set(hours)).sort((a, b) => a - b);
  if (uniq.length === 24) return "종일";
  if (uniq.length === 0) return "없음";

  const ranges: Array<[number, number]> = [];
  let s = uniq[0],
    prev = uniq[0];
  for (let i = 1; i < uniq.length; i++) {
    const h = uniq[i];
    if (h === prev + 1) {
      prev = h;
      continue;
    }
    ranges.push([s, prev]);
    s = prev = h;
  }
  ranges.push([s, prev]);

  return ranges
    .map(([a, b]) =>
      a === b
        ? `${String(a).padStart(2, "0")}시`
        : `${String(a).padStart(2, "0")}–${String(b).padStart(2, "0")}시`
    )
    .join(", ");
}

/**
 * 시계 형식 문자열을 24시간 형식 숫자로 변환합니다.
 */
function to24(t: string): number | null {
  const m = t.match(/^(\d{1,2})(?::\d{1,2})?\s*(am|pm)?$/i);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const ampm = (m[2] || "").toLowerCase();
  if (ampm === "am") {
    if (h === 12) h = 0;
  } else if (ampm === "pm") {
    if (h !== 12) h += 12;
  }
  return h >= 0 && h <= 23 ? h : null;
}

/**
 * 아이템의 특정 월 시간 정보를 포맷된 문자열로 반환합니다.
 *
 * @param item - 아이템 객체
 * @param month - 월 (1~12)
 * @param hemi - 반구 ("north" | "south")
 * @returns 포맷된 시간 문자열 (예: "04–21시", "종일", "정보 없음")
 */
export function formatTimesForMonth(
  item: Item,
  month: number,
  hemi: "north" | "south"
): string {
  const key = String(month);
  const val =
    (hemi === "north"
      ? item.north_times_by_month?.[key]
      : item.south_times_by_month?.[key]) ?? item.times_by_month?.[key];

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
        if (a && b) {
          const sh = to24(a),
            eh = to24(b);
          if (sh == null || eh == null) return seg;
          return `${String(sh).padStart(2, "0")}–${String(eh).padStart(2, "0")}시`;
        }
        const hh = to24(seg);
        return hh == null ? seg : `${String(hh).padStart(2, "0")}시`;
      });

    return segs.length ? segs.join(", ") : "정보 없음";
  }

  if (
    Array.isArray(val) &&
    val.length === 24 &&
    typeof val[0] === "boolean"
  ) {
    const hours = (val as boolean[])
      .map((ok, h) => (ok ? h : null))
      .filter((h) => h !== null) as number[];
    return compressHourList(hours);
  }

  if (Array.isArray(val) && val.length > 0 && typeof val[0] === "number") {
    const hours = (val as number[]).filter((h) => h >= 0 && h <= 23);
    return compressHourList(hours);
  }

  if (Array.isArray(val) && val.length > 0 && typeof val[0] === "object") {
    const parts = (val as Array<{ start: string; end: string }>).map(
      (r) => `${r.start}–${r.end}`
    );
    return parts.length ? parts.join(", ") : "정보 없음";
  }

  return "정보 없음";
}
