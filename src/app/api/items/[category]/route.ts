import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { acnhItems, acnhAvailability } from "@/db/schema"
import { eq, inArray } from "drizzle-orm"
import { nameKoMap, locationKoMap } from "@/lib/localization"
import type { Category, Habitat } from "@/types/acnh"

const VALID_CATEGORIES: Category[] = ["fish", "bug", "sea", "fossil"]
const VALID_HABITATS: Habitat[] = ["all", "pond", "river", "clifftop", "riverMouth", "pier", "sea"]

/**
 * location 문자열을 6가지 서식지 분류로 매핑합니다.
 * - pond: 연못/호수
 * - river: 강 일반
 * - clifftop: 절벽 위 강
 * - riverMouth: 강 하구
 * - pier: 부두
 * - sea: 바다
 */
function getHabitat(loc?: string | null): Habitat {
  if (!loc) return "all"
  const s = loc.toLowerCase()

  // 부두
  if (s.includes("pier") || s.includes("부두")) return "pier"

  // 절벽 위 강
  if (s.includes("clifftop") || s.includes("절벽")) return "clifftop"

  // 강(하구)
  if (s.includes("mouth") || s.includes("강 하구")) return "riverMouth"

  // 바다
  if (s.includes("sea") || s.includes("ocean") || s.includes("beach") || s.includes("바다"))
    return "sea"

  // 연못/호수
  if (s.includes("pond") || s.includes("lake") || s.includes("연못") || s.includes("호수"))
    return "pond"

  // 강(일반)
  if (s.includes("river") || s.includes("강")) return "river"

  return "all"
}

/**
 * 아이템 목록을 조회하는 API 엔드포인트
 * 
 * 쿼리 파라미터:
 * - month: 월 필터 (1~12, 전체는 생략)
 * - hemi: 반구 ("north" | "south", 기본값: "north")
 * - only: 서버측 월 필터 적용 여부 ("1"이면 해당 월에만 존재하는 아이템만 반환)
 * 
 * @param req - 요청 객체
 * @param ctx - 라우트 컨텍스트 (category 파라미터 포함)
 * @returns 아이템 목록과 가용성 정보를 포함한 JSON 응답
 */
export async function GET(
  req: Request,
  ctx: { params: Promise<{ category: Category }> }
) {
  const { category } = await ctx.params
  if (!VALID_CATEGORIES.includes(category)) {
    return NextResponse.json({ ok: false, error: "Invalid category" })
  }

  const url = new URL(req.url)
  const month = Number(url.searchParams.get("month")); // 1~12
  const hemi: "north" | "south" =
    url.searchParams.get("hemi") === "south" ? "south" : "north"
  const only = url.searchParams.get("only") === "1"
  const hourParam = url.searchParams.get("hour")
  const hour = hourParam !== null ? Number(hourParam) : null
  const habitatParam = url.searchParams.get("habitat") as Habitat | null
  const habitat: Habitat = habitatParam && VALID_HABITATS.includes(habitatParam) ? habitatParam : "all"
  const search = url.searchParams.get("search")?.toLowerCase().trim() || ""
  const sortParam = url.searchParams.get("sort")
  const sort: "priceDesc" | "priceAsc" | null =
    sortParam === "priceAsc" ? "priceAsc" : sortParam === "priceDesc" ? "priceDesc" : null

  try {
    // 1) 아이템 조회
    const items = await db
      .select({
        id: acnhItems.id,
        originalName: acnhItems.originalName,
        nameKo: acnhItems.nameKo,
        imageUrl: acnhItems.imageUrl,
        location: acnhItems.location,
        sellNook: acnhItems.sellNook,
        shadowSize: acnhItems.shadowSize,
      })
      .from(acnhItems)
      .where(eq(acnhItems.category, category))

    if (items.length === 0) {
      return NextResponse.json({ ok: true, data: [] })
    }

    const itemIdList = items.map((it) => it.id)

    // 2) 가용성(반구/월/시간 마스크) 한 방에 가져오기
    const avs = await db
      .select({
        itemId: acnhAvailability.itemId,
        hemisphere: acnhAvailability.hemisphere,
        month: acnhAvailability.month,
        hoursMask: acnhAvailability.hoursMask,
      })
      .from(acnhAvailability)
      .where(inArray(acnhAvailability.itemId, itemIdList))

    // 3) 아이템별로 북/남반구 month 배열 + times 맵 만들기
    type TimesMap = Record<string, string>; // {"1": "All day" | "NA" | "4 AM – 9 PM" ...}
    type HoursMaskMap = Record<string, number>; // {"1": hoursMask, ...}
    const byItem: Record<
      number,
      {
        northMonths: number[]
        southMonths: number[]
        northTimes: TimesMap
        southTimes: TimesMap
        northHoursMask: HoursMaskMap
        southHoursMask: HoursMaskMap
      }
    > = {}

    for (const it of itemIdList) {
      byItem[it] = {
        northMonths: [],
        southMonths: [],
        northTimes: {},
        southTimes: {},
        northHoursMask: {},
        southHoursMask: {},
      }
    }

    /**
     * 비트마스크를 시간 라벨 문자열로 변환합니다.
     * 
     * 비트마스크는 24비트 정수로, 각 비트는 해당 시간(0~23시)의 가용성을 나타냅니다.
     * 예: 0x00000FFF (0~11시 활성) → "12 AM – 11 AM"
     * 
     * @param mask - 24비트 시간 마스크 (0~0xFFFFFF)
     * @returns 시간 라벨 문자열 ("All day" | "NA" | "4 AM – 9 PM, ...")
     */
    const maskToLabel = (mask: number): string => {
      if (!mask || mask === 0) return "NA"
      if (mask === 0xffffff) return "All day"; // 24비트 all on
      
      // 0~23 연속 구간으로 묶기
      const hours: number[] = []
      for (let h = 0; h < 24; h++) {
        if (mask & (1 << h)) hours.push(h)
      }
      
      // 연속 구간 찾기
      const ranges: Array<[number, number]> = []
      let start = hours[0]
      let prev = hours[0]
      for (let i = 1; i < hours.length; i++) {
        const h = hours[i]
        if (h === prev + 1) {
          prev = h
        } else {
          ranges.push([start, prev + 1]); // [start, endExclusive]
          start = h
          prev = h
        }
      }
      ranges.push([start, prev + 1])

      // 24시 경계 래핑 처리 (예: 21~24, 0~4 → 21~4)
      // 자정을 넘어가는 시간대를 하나의 구간으로 합칩니다
      if (ranges.length >= 2) {
        const first = ranges[0]
        const last = ranges[ranges.length - 1]
        if (first[0] === 0 && last[1] === 24) {
          // 합치기: [last.start, first.end] with wrap
          const merged: Array<[number, number]> = [[last[0], first[1]]]
          // 사이에 낀 구간들
          for (let i = 1; i < ranges.length - 1; i++) merged.push(ranges[i])
          // 래핑 구간을 뒤로 보내서 "9 PM–4 AM" 같은 표현을 만듭니다
          ranges.splice(0, ranges.length, ...merged)
        }
      }

      /**
       * 시간(0~23)을 12시간 형식 문자열로 변환합니다.
       * @param h - 시간 (0~23)
       * @returns "12 AM", "1 PM" 등의 형식 문자열
       */
      const toStr = (h: number) => {
        const hh = ((h % 24) + 24) % 24
        const ampm = hh < 12 ? "AM" : "PM"
        const h12 = hh % 12 === 0 ? 12 : hh % 12
        return `${h12} ${ampm}`
      }

      return ranges
        .map(([s, e]) => `${toStr(s)} – ${toStr(e % 24)}`)
        .join(", ")
    }

    for (const av of avs) {
      const box = byItem[av.itemId]
      if (!box) continue
      const m = av.month
      const label = maskToLabel(av.hoursMask)

      if (av.hemisphere === "north") {
        if (!box.northMonths.includes(m)) box.northMonths.push(m)
        box.northTimes[String(m)] = label
        box.northHoursMask[String(m)] = av.hoursMask
      } else {
        if (!box.southMonths.includes(m)) box.southMonths.push(m)
        box.southTimes[String(m)] = label
        box.southHoursMask[String(m)] = av.hoursMask
      }
    }

    const normalizedWithId = items.map((it) => {
      const box = byItem[it.id]!
      // fossil 등 month 개념이 빈 경우를 대비해 보호코드
      const northMonths = box.northMonths.length ? box.northMonths : Array.from({ length: 12 }, (_, i) => i + 1)
      const southMonths = box.southMonths.length ? box.southMonths : Array.from({ length: 12 }, (_, i) => i + 1)

      const nameKo = it.nameKo || nameKoMap[it.originalName] || it.originalName
      const location = locationKoMap[it.location || ""] || it.location || "알 수 없음"

      const commonTimes =
        hemi === "north"
          ? (Object.keys(box.northTimes).length ? box.northTimes : Object.keys(box.southTimes).length ? box.southTimes : undefined)
          : (Object.keys(box.southTimes).length ? box.southTimes : Object.keys(box.northTimes).length ? box.northTimes : undefined)

      return {
        _itemId: it.id, // 내부 필터링용 (응답에서 제거됨)
        originalName: it.originalName,
        name: nameKo,
        image_url: it.imageUrl,
        sell_nook: it.sellNook ?? undefined,
        location,
        shadow_size: it.shadowSize ?? undefined,
        north: { months_array: northMonths },
        south: { months_array: southMonths },
        north_times_by_month: box.northTimes,
        south_times_by_month: box.southTimes,
        times_by_month: commonTimes, // 클라 호환용 공통 키
      }
    })

    // 5) 서버측 월 필터(only=1)
    let filtered =
      only && month >= 1 && month <= 12
        ? normalizedWithId.filter((it) =>
          (hemi === "north" ? it.north.months_array : it.south.months_array).includes(month)
        )
        : normalizedWithId

    // 6) 서버측 시간 필터(hour 파라미터)
    if (hour !== null && hour >= 0 && hour <= 23 && month >= 1 && month <= 12) {
      filtered = filtered.filter((it) => {
        const box = byItem[it._itemId]
        if (!box) return true
        const hoursMaskMap = hemi === "north" ? box.northHoursMask : box.southHoursMask
        const mask = hoursMaskMap[String(month)] ?? 0
        return (mask & (1 << hour)) !== 0
      })
    }

    // 7) 서버측 서식지 필터(habitat 파라미터, fish 전용)
    if (category === "fish" && habitat !== "all") {
      filtered = filtered.filter((it) => {
        const itemHabitat = getHabitat(it.location)
        return itemHabitat === habitat
      })
    }

    // 8) 서버측 검색 필터(search 파라미터)
    if (search) {
      filtered = filtered.filter((it) =>
        it.name.toLowerCase().includes(search) ||
        it.originalName.toLowerCase().includes(search)
      )
    }

    // 9) 서버측 정렬(sort 파라미터)
    // 주의: 미포획/포획 그룹 정렬은 클라이언트에서 수행 (caughtSet 필요)
    if (sort) {
      filtered = filtered.slice().sort((a, b) => {
        const pa = a.sell_nook ?? null
        const pb = b.sell_nook ?? null

        // null 처리: null은 항상 뒤로
        if (pa === null && pb === null) return a.name.localeCompare(b.name, "ko")
        if (pa === null) return 1
        if (pb === null) return -1

        if (sort === "priceAsc") {
          if (pa !== pb) return pa - pb
          return a.name.localeCompare(b.name, "ko")
        } else {
          if (pa !== pb) return pb - pa
          return a.name.localeCompare(b.name, "ko")
        }
      })
    }

    // 응답에서 _itemId 제거
    const data = filtered.map(({ _itemId, ...rest }) => rest)

    return NextResponse.json({ ok: true, data })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ ok: false, error: "Server error" })
  }
}
