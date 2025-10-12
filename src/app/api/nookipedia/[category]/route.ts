import { NextResponse } from "next/server";
import { nameKoMap, locationKoMap } from "@/lib/localization";

const VALID_CATEGORIES = ["fish", "bug", "sea", "fossil"] as const;
type ValidCategory = (typeof VALID_CATEGORIES)[number];

export async function GET(
  req: Request,
  context: { params: Promise<{ category: ValidCategory }> }
) {
  const { category } = await context.params;
  if (!VALID_CATEGORIES.includes(category)) {
    return NextResponse.json({ ok: false, error: "Invalid category" });
  }

  const url = new URL(req.url);
  const month = Number(url.searchParams.get("month")); // 1~12
  const hemi = url.searchParams.get("hemi") === "south" ? "south" : "north";
  const only = url.searchParams.get("only") === "1";

  const endpointMap: Record<ValidCategory, string> = {
    fish: "https://api.nookipedia.com/nh/fish",
    bug: "https://api.nookipedia.com/nh/bugs",
    sea: "https://api.nookipedia.com/nh/sea",
    fossil: "https://api.nookipedia.com/nh/fossils/all",
  };

  const allMonths = Array.from({ length: 12 }, (_, i) => i + 1);

  // 구/신 스키마 모두 대응해서 month 배열을 뽑아내는 헬퍼
  function extractMonthsArray(raw: any, hemisphere: "north" | "south"): number[] {
    // 신 스키마: { north: { months_array, times_by_month }, south: { ... } }
    const nested = raw?.[hemisphere]?.months_array;
    if (Array.isArray(nested) && nested.length) return nested.map(Number);

    // 구 스키마 폴백
    const flatA = raw?.[`months_${hemisphere}_array`];
    if (Array.isArray(flatA) && flatA.length) return flatA.map(Number);

    const flatB = raw?.[`${hemisphere}_months_array`];
    if (Array.isArray(flatB) && flatB.length) return flatB.map(Number);

    // 최후 폴백: times_by_month에서 NA 아닌 달 추출
    const tbm = raw?.[hemisphere]?.times_by_month || raw?.[`times_by_month_${hemisphere}`];
    if (tbm && typeof tbm === "object") {
      const months = Object.entries(tbm)
        .filter(([, v]) => v && String(v).toUpperCase() !== "NA")
        .map(([k]) => Number(k));
      if (months.length) return months;
    }
    return allMonths;
  }

  // 반구별 times_by_month를 Record<"1"|"2"|...,"string|array|..."> 형태로 안전 추출
  function extractTimesByMonth(raw: any, hemisphere: "north" | "south"):
    | Record<string, unknown>
    | undefined {
    // 신 스키마 우선
    const nested = raw?.[hemisphere]?.times_by_month;
    if (nested && typeof nested === "object") return nested;

    // 구 스키마 1: times_by_month_north / times_by_month_south
    const flatA = raw?.[`times_by_month_${hemisphere}`];
    if (flatA && typeof flatA === "object") return flatA;

    // 구 스키마 2: times_by_month에 반구 키가 중첩된 경우
    const maybeNested = raw?.times_by_month?.[hemisphere];
    if (maybeNested && typeof maybeNested === "object") return maybeNested;

    // 일부 스키마는 month 키가 숫자 배열/문자열로 직접 들어있을 수 있음
    const direct = raw?.times_by_month;
    if (direct && typeof direct === "object" && !("north" in direct) && !("south" in direct)) {
      return direct;
    }

    return undefined; // 못 찾음
  }

  try {
    const res = await fetch(endpointMap[category], {
      headers: {
        "X-API-KEY": process.env.NOOKIPEDIA_API_KEY!,
        "Accept-Version": "1.3.0", // 신 스키마(반구 중첩) 우선. 필요시 제거해도 최신 응답.
      },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Fetch failed: ${endpointMap[category]} (${res.status})`);

    const rawData = await res.json();

    interface NormalizedItem {
      originalName: string;
      name: string;
      image_url: string;
      sell_nook?: number;
      location?: string;
      north: { months_array: number[] };
      south: { months_array: number[] };

      // ✅ 시간 필터용: 반구별 타임맵을 그대로 전달 (클라에서 nowOnly 필터에 사용)
      north_times_by_month?: Record<string, unknown>;
      south_times_by_month?: Record<string, unknown>;

      // ✅ 호환용 공통 키도 제공 (클라가 공통 키를 먼저 보게 되어 있으면 여기로도 접근 가능)
      times_by_month?: Record<string, unknown>;
    }

    let normalized: NormalizedItem[] = [];

    if (category === "fossil") {
      // 화석은 시간/월 개념이 사실상 무관 → 연중/하루종일로 처리
      for (const dino of rawData as any[]) {
        for (const fossil of dino.fossils) {
          // all day를 뜻하는 문자열을 1~12 전부에 부여
          const allDayMap: Record<string, string> =
            Object.fromEntries(allMonths.map((m) => [String(m), "All day"]));
          normalized.push({
            originalName: fossil.name,
            name: nameKoMap[fossil.name] || fossil.name,
            image_url: fossil.image_url,
            sell_nook: fossil.sell,
            location: locationKoMap["Museum"] || "박물관",
            north: { months_array: allMonths },
            south: { months_array: allMonths },
            north_times_by_month: allDayMap,
            south_times_by_month: allDayMap,
            times_by_month: allDayMap,
          });
        }
      }
    } else {
      normalized = (rawData as any[]).map((it) => {
        const northMonths = extractMonthsArray(it, "north");
        const southMonths = extractMonthsArray(it, "south");

        const northTimes = extractTimesByMonth(it, "north");
        const southTimes = extractTimesByMonth(it, "south");

        // 공통 키: 반구 우선(요청 반구), 없으면 다른 반구/직접 times_by_month 순서로 폴백
        const commonTimes =
          (hemi === "north" ? northTimes : southTimes) ??
          (hemi === "north" ? southTimes : northTimes) ??
          (it?.times_by_month && typeof it.times_by_month === "object" ? it.times_by_month : undefined);

        return {
          originalName: it.name,
          name: nameKoMap[it.name] || it.name,
          image_url: it.image_url,
          sell_nook: it.sell_nook,
          location: locationKoMap[it.location] || it.location || "알 수 없음",
          north: { months_array: northMonths },
          south: { months_array: southMonths },

          // ✅ 반구별 타임맵 추가
          north_times_by_month: northTimes,
          south_times_by_month: southTimes,
          // ✅ 호환용 공통 타임맵
          times_by_month: commonTimes,
        };
      });
    }

    // 서버 측 월 필터 (요청이 only=1일 때)
    let data = normalized;
    if (only && month >= 1 && month <= 12) {
      data = normalized.filter((it) => it[hemi]?.months_array?.includes(month));
    }

    return NextResponse.json({ ok: true, data });
  } catch (err) {
    console.error("Nookipedia fetch error:", err);
    return NextResponse.json({ ok: false, error: "Server error" });
  }
}
