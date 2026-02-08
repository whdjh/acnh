import type { Item } from "@/types/acnh"

function compressHourList(hours: number[], locale: string): string {
  const uniq = Array.from(new Set(hours)).sort((a, b) => a - b)
  if (uniq.length === 24) return locale === "en" ? "All day" : locale === "ja" ? "終日" : "종일"
  if (uniq.length === 0) return locale === "en" ? "None" : locale === "ja" ? "なし" : "없음"

  const ranges: Array<[number, number]> = []
  let s = uniq[0],
    prev = uniq[0]
  for (let i = 1; i < uniq.length; i++) {
    const h = uniq[i]
    if (h === prev + 1) {
      prev = h
      continue
    }
    ranges.push([s, prev])
    s = prev = h
  }
  ranges.push([s, prev])

  const hourSuffix = locale === "en" ? ":00" : locale === "ja" ? "時" : "시"

  return ranges
    .map(([a, b]) =>
      a === b
        ? `${String(a).padStart(2, "0")}${hourSuffix}`
        : `${String(a).padStart(2, "0")}–${String(b).padStart(2, "0")}${hourSuffix}`
    )
    .join(", ")
}

function to24(t: string): number | null {
  const m = t.match(/^(\d{1,2})(?::\d{1,2})?\s*(am|pm)?$/i)
  if (!m) return null
  let h = parseInt(m[1], 10)
  const ampm = (m[2] || "").toLowerCase()
  if (ampm === "am") {
    if (h === 12) h = 0
  } else if (ampm === "pm") {
    if (h !== 12) h += 12
  }
  return h >= 0 && h <= 23 ? h : null
}

export function formatTimesForMonth(
  item: Item,
  month: number,
  hemi: "north" | "south",
  locale: string = "ko"
): string {
  const noInfo = locale === "en" ? "No info" : locale === "ja" ? "情報なし" : "정보 없음"
  const allDay = locale === "en" ? "All day" : locale === "ja" ? "終日" : "종일"
  const hourSuffix = locale === "en" ? ":00" : locale === "ja" ? "時" : "시"

  const key = String(month)
  const val =
    (hemi === "north"
      ? item.north_times_by_month?.[key]
      : item.south_times_by_month?.[key]) ?? item.times_by_month?.[key]

  if (val == null) return noInfo

  if (typeof val === "string") {
    const s = val.trim()
    if (!s) return noInfo
    if (/all\s*day/i.test(s)) return allDay

    const segs = s
      .toLowerCase()
      .split(/[,/&;]+/)
      .map((seg) => seg.trim())
      .filter(Boolean)
      .map((seg) => {
        const [a, b] = seg.split(/-|–|—/).map((x) => x.trim())
        if (a && b) {
          const sh = to24(a),
            eh = to24(b)
          if (sh == null || eh == null) return seg
          return `${String(sh).padStart(2, "0")}–${String(eh).padStart(2, "0")}${hourSuffix}`
        }
        const hh = to24(seg)
        return hh == null ? seg : `${String(hh).padStart(2, "0")}${hourSuffix}`
      })

    return segs.length ? segs.join(", ") : noInfo
  }

  if (
    Array.isArray(val) &&
    val.length === 24 &&
    typeof val[0] === "boolean"
  ) {
    const hours = (val as boolean[])
      .map((ok, h) => (ok ? h : null))
      .filter((h) => h !== null) as number[]
    return compressHourList(hours, locale)
  }

  if (Array.isArray(val) && val.length > 0 && typeof val[0] === "number") {
    const hours = (val as number[]).filter((h) => h >= 0 && h <= 23)
    return compressHourList(hours, locale)
  }

  if (Array.isArray(val) && val.length > 0 && typeof val[0] === "object") {
    const parts = (val as Array<{ start: string; end: string }>).map(
      (r) => `${r.start}–${r.end}`
    )
    return parts.length ? parts.join(", ") : noInfo
  }

  return noInfo
}
