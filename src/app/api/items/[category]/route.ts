import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { acnhItems, acnhAvailability } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { nameKoMap, locationKoMap } from "@/lib/localization";

const VALID_CATEGORIES = ["fish", "bug", "sea", "fossil"] as const;
type ValidCategory = (typeof VALID_CATEGORIES)[number];

export async function GET(
  req: Request,
  ctx: { params: Promise<{ category: ValidCategory }> }
) {
  const { category } = await ctx.params;
  if (!VALID_CATEGORIES.includes(category)) {
    return NextResponse.json({ ok: false, error: "Invalid category" });
  }

  const url = new URL(req.url);
  const month = Number(url.searchParams.get("month")); // 1~12
  const hemi: "north" | "south" =
    url.searchParams.get("hemi") === "south" ? "south" : "north";
  const only = url.searchParams.get("only") === "1";

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
        raw: acnhItems.raw,
        shadowSize: acnhItems.shadowSize,
      })
      .from(acnhItems)
      .where(eq(acnhItems.category, category));

    if (items.length === 0) {
      return NextResponse.json({ ok: true, data: [] });
    }

    const itemIdList = items.map((it) => it.id);

    // 2) 가용성(반구/월/시간 마스크) 한 방에 가져오기
    const avs = await db
      .select({
        itemId: acnhAvailability.itemId,
        hemisphere: acnhAvailability.hemisphere,
        month: acnhAvailability.month,
        hoursMask: acnhAvailability.hoursMask,
      })
      .from(acnhAvailability)
      .where(inArray(acnhAvailability.itemId, itemIdList));

    // 3) 아이템별로 북/남반구 month 배열 + times 맵 만들기
    type TimesMap = Record<string, string>; // {"1": "All day" | "NA" | "4 AM – 9 PM" ...}
    const byItem: Record<
      number,
      {
        northMonths: number[];
        southMonths: number[];
        northTimes: TimesMap;
        southTimes: TimesMap;
      }
    > = {};

    for (const it of itemIdList) {
      byItem[it] = {
        northMonths: [],
        southMonths: [],
        northTimes: {},
        southTimes: {},
      };
    }

    // 비트마스크(0~23) → 라벨("All day" | "NA" | "x AM – y PM, ...")
    const maskToLabel = (mask: number): string => {
      if (!mask || mask === 0) return "NA";
      if (mask === 0xffffff) return "All day"; // 24비트 all on
      // 0~23 연속 구간으로 묶기
      const hours: number[] = [];
      for (let h = 0; h < 24; h++) {
        if (mask & (1 << h)) hours.push(h);
      }
      // 연속 구간 찾기
      const ranges: Array<[number, number]> = [];
      let start = hours[0];
      let prev = hours[0];
      for (let i = 1; i < hours.length; i++) {
        const h = hours[i];
        if (h === prev + 1) {
          prev = h;
        } else {
          ranges.push([start, prev + 1]); // [start, endExclusive]
          start = h;
          prev = h;
        }
      }
      ranges.push([start, prev + 1]);

      // 24시 경계 래핑(예: 21~24, 0~4 → 21~4)
      if (ranges.length >= 2) {
        const first = ranges[0];
        const last = ranges[ranges.length - 1];
        if (first[0] === 0 && last[1] === 24) {
          // 합치기: [last.start, first.end] with wrap
          const merged: Array<[number, number]> = [[last[0], first[1]]];
          // 사이에 낀 구간들
          for (let i = 1; i < ranges.length - 1; i++) merged.push(ranges[i]);
          // 래핑 구간을 뒤로 보내서 “9 PM–4 AM” 같은 표현을 만들자
          ranges.splice(0, ranges.length, ...merged);
        }
      }

      const toStr = (h: number) => {
        const hh = ((h % 24) + 24) % 24;
        const ampm = hh < 12 ? "AM" : "PM";
        const h12 = hh % 12 === 0 ? 12 : hh % 12;
        return `${h12} ${ampm}`;
      };

      return ranges
        .map(([s, e]) => `${toStr(s)} – ${toStr(e % 24)}`)
        .join(", ");
    };

    for (const av of avs) {
      const box = byItem[av.itemId];
      if (!box) continue;
      const m = av.month;
      const label = maskToLabel(av.hoursMask);

      if (av.hemisphere === "north") {
        if (!box.northMonths.includes(m)) box.northMonths.push(m);
        box.northTimes[String(m)] = label;
      } else {
        if (!box.southMonths.includes(m)) box.southMonths.push(m);
        box.southTimes[String(m)] = label;
      }
    }

    const normalized = items.map((it) => {
      const box = byItem[it.id]!;
      // fossil 등 month 개념이 빈 경우를 대비해 보호코드
      const northMonths = box.northMonths.length ? box.northMonths : Array.from({ length: 12 }, (_, i) => i + 1);
      const southMonths = box.southMonths.length ? box.southMonths : Array.from({ length: 12 }, (_, i) => i + 1);

      const nameKo = it.nameKo || nameKoMap[it.originalName] || it.originalName;
      const location = locationKoMap[it.location || ""] || it.location || "알 수 없음";

      const commonTimes =
        hemi === "north"
          ? (Object.keys(box.northTimes).length ? box.northTimes : Object.keys(box.southTimes).length ? box.southTimes : undefined)
          : (Object.keys(box.southTimes).length ? box.southTimes : Object.keys(box.northTimes).length ? box.northTimes : undefined);

      return {
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
      };
    });

    // 5) 서버측 월 필터(only=1)
    const filtered =
      only && month >= 1 && month <= 12
        ? normalized.filter((it) =>
          (hemi === "north" ? it.north.months_array : it.south.months_array).includes(month)
        )
        : normalized;

    return NextResponse.json({ ok: true, data: filtered });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: "Server error" });
  }
}
