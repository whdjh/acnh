import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { acnhItems, acnhAvailability } from "@/db/schema"
import { eq, inArray } from "drizzle-orm"
import { nameKoMap, getLocalizedShadowSize, getLocalizedLocation, getLocalizedName } from "@/lib/localization"
import type { Category, Habitat } from "@/types/acnh"

const VALID_CATEGORIES: Category[] = ["fish", "bug", "sea", "fossil"]
const VALID_HABITATS: Habitat[] = ["all", "pond", "river", "clifftop", "riverMouth", "pier", "sea"]

function getHabitat(loc?: string | null): Habitat {
  if (!loc) return "all"
  const s = loc.toLowerCase()

  if (s.includes("pier") || s.includes("부두")) return "pier"
  if (s.includes("clifftop") || s.includes("절벽")) return "clifftop"
  if (s.includes("mouth") || s.includes("강 하구")) return "riverMouth"
  if (s.includes("sea") || s.includes("ocean") || s.includes("beach") || s.includes("바다"))
    return "sea"
  if (s.includes("pond") || s.includes("lake") || s.includes("연못") || s.includes("호수"))
    return "pond"
  if (s.includes("river") || s.includes("강")) return "river"

  return "all"
}

export async function GET(
  req: Request,
  ctx: { params: Promise<{ category: Category }> }
) {
  const { category } = await ctx.params
  if (!VALID_CATEGORIES.includes(category)) {
    return NextResponse.json({ ok: false, error: "Invalid category" })
  }

  const url = new URL(req.url)
  const month = Number(url.searchParams.get("month"));
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
  const locale = url.searchParams.get("locale") || "ko"

  try {
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

    const avs = await db
      .select({
        itemId: acnhAvailability.itemId,
        hemisphere: acnhAvailability.hemisphere,
        month: acnhAvailability.month,
        hoursMask: acnhAvailability.hoursMask,
      })
      .from(acnhAvailability)
      .where(inArray(acnhAvailability.itemId, itemIdList))

    type TimesMap = Record<string, string>;
    type HoursMaskMap = Record<string, number>;
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

    const maskToLabel = (mask: number): string => {
      if (!mask || mask === 0) return "NA"
      if (mask === 0xffffff) return "All day";

      const hours: number[] = []
      for (let h = 0; h < 24; h++) {
        if (mask & (1 << h)) hours.push(h)
      }

      const ranges: Array<[number, number]> = []
      let start = hours[0]
      let prev = hours[0]
      for (let i = 1; i < hours.length; i++) {
        const h = hours[i]
        if (h === prev + 1) {
          prev = h
        } else {
          ranges.push([start, prev + 1]);
          start = h
          prev = h
        }
      }
      ranges.push([start, prev + 1])

      if (ranges.length >= 2) {
        const first = ranges[0]
        const last = ranges[ranges.length - 1]
        if (first[0] === 0 && last[1] === 24) {
          const merged: Array<[number, number]> = [[last[0], first[1]]]
          for (let i = 1; i < ranges.length - 1; i++) merged.push(ranges[i])
          ranges.splice(0, ranges.length, ...merged)
        }
      }

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
      const northMonths = box.northMonths.length ? box.northMonths : Array.from({ length: 12 }, (_, i) => i + 1)
      const southMonths = box.southMonths.length ? box.southMonths : Array.from({ length: 12 }, (_, i) => i + 1)

      const nameKo = it.nameKo || nameKoMap[it.originalName] || it.originalName
      const name = getLocalizedName(it.originalName, nameKo, locale)
      const rawLoc = it.location || ""
      const location = getLocalizedLocation(rawLoc, locale)

      const commonTimes =
        hemi === "north"
          ? (Object.keys(box.northTimes).length ? box.northTimes : Object.keys(box.southTimes).length ? box.southTimes : undefined)
          : (Object.keys(box.southTimes).length ? box.southTimes : Object.keys(box.northTimes).length ? box.northTimes : undefined)

      return {
        _itemId: it.id,
        originalName: it.originalName,
        name,
        image_url: it.imageUrl,
        sell_nook: it.sellNook ?? undefined,
        location,
        shadow_size: it.shadowSize ? getLocalizedShadowSize(it.shadowSize, locale) : undefined,
        north: { months_array: northMonths },
        south: { months_array: southMonths },
        north_times_by_month: box.northTimes,
        south_times_by_month: box.southTimes,
        times_by_month: commonTimes,
      }
    })

    let filtered =
      only && month >= 1 && month <= 12
        ? normalizedWithId.filter((it) =>
          (hemi === "north" ? it.north.months_array : it.south.months_array).includes(month)
        )
        : normalizedWithId

    if (hour !== null && hour >= 0 && hour <= 23 && month >= 1 && month <= 12) {
      filtered = filtered.filter((it) => {
        const box = byItem[it._itemId]
        if (!box) return true
        const hoursMaskMap = hemi === "north" ? box.northHoursMask : box.southHoursMask
        const mask = hoursMaskMap[String(month)] ?? 0
        return (mask & (1 << hour)) !== 0
      })
    }

    if (category === "fish" && habitat !== "all") {
      filtered = filtered.filter((it) => {
        const itemHabitat = getHabitat(it.location)
        return itemHabitat === habitat
      })
    }

    if (search) {
      filtered = filtered.filter((it) =>
        it.name.toLowerCase().includes(search) ||
        it.originalName.toLowerCase().includes(search)
      )
    }

    if (sort) {
      const sortLocale = locale === "en" ? "en" : locale === "ja" ? "ja" : "ko"
      filtered = filtered.slice().sort((a, b) => {
        const pa = a.sell_nook ?? null
        const pb = b.sell_nook ?? null

        if (pa === null && pb === null) return a.name.localeCompare(b.name, sortLocale)
        if (pa === null) return 1
        if (pb === null) return -1

        if (sort === "priceAsc") {
          if (pa !== pb) return pa - pb
          return a.name.localeCompare(b.name, sortLocale)
        } else {
          if (pa !== pb) return pb - pa
          return a.name.localeCompare(b.name, sortLocale)
        }
      })
    }

    const data = filtered.map(({ _itemId, ...rest }) => rest)

    return NextResponse.json({ ok: true, data })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ ok: false, error: "Server error" })
  }
}
