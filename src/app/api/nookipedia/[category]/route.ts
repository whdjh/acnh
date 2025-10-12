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

    // 구 스키마 폴백: months_north_array / months_south_array 또는 변형명
    const flatA = raw?.[`months_${hemisphere}_array`];
    if (Array.isArray(flatA) && flatA.length) return flatA.map(Number);

    const flatB = raw?.[`${hemisphere}_months_array`];
    if (Array.isArray(flatB) && flatB.length) return flatB.map(Number);

    // 최후 폴백: times_by_month에서 "NA"가 아닌 달을 추출
    const tbm = raw?.[hemisphere]?.times_by_month || raw?.[`times_by_month_${hemisphere}`];
    if (tbm && typeof tbm === "object") {
      const months = Object.entries(tbm)
        .filter(([, v]) => v && String(v).toUpperCase() !== "NA")
        .map(([k]) => Number(k));
      if (months.length) return months;
    }

    // 정말 정보가 없으면 "연중"으로 간주 (문어 같은 애들)
    return allMonths;
  }

  try {
    const res = await fetch(endpointMap[category], {
      headers: {
        "X-API-KEY": process.env.NOOKIPEDIA_API_KEY!,
        // 최신 구조( north/south + months_array ) 사용. 필요시 아예 헤더 제거해도 최신으로 옵니다.
        "Accept-Version": "1.3.0",
      },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Fetch failed: ${endpointMap[category]}`);

    const rawData = await res.json();

    interface NormalizedItem {
      originalName: string;
      name: string;
      image_url: string;
      sell_nook?: number;
      location?: string;
      north: { months_array: number[] };
      south: { months_array: number[] };
    }

    let normalized: NormalizedItem[] = [];

    if (category === "fossil") {
      for (const dino of rawData as any[]) {
        for (const fossil of dino.fossils) {
          normalized.push({
            originalName: fossil.name,
            name: nameKoMap[fossil.name] || fossil.name,
            image_url: fossil.image_url,
            sell_nook: fossil.sell,
            location: locationKoMap["Museum"] || "박물관",
            north: { months_array: allMonths },
            south: { months_array: allMonths },
          });
        }
      }
    } else {
      normalized = (rawData as any[]).map((it) => {
        const northMonths = extractMonthsArray(it, "north");
        const southMonths = extractMonthsArray(it, "south");
        return {
          originalName: it.name,
          name: nameKoMap[it.name] || it.name,
          image_url: it.image_url,
          sell_nook: it.sell_nook,
          location: locationKoMap[it.location] || it.location || "알 수 없음",
          north: { months_array: northMonths },
          south: { months_array: southMonths },
        };
      });
    }

    // 서버 측 월 필터
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
