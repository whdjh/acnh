import { NextResponse } from "next/server";
import { nameKoMap, locationKoMap } from "@/lib/localization";

const VALID_CATEGORIES = ["fish", "bug", "sea", "fossil"];

export async function GET(
  req: Request,
  context: { params: Promise<{ category: string }> }
) {
  // params는 Promise라 await 필요
  const { category } = await context.params;

  if (!VALID_CATEGORIES.includes(category)) {
    return NextResponse.json({ ok: false, error: "Invalid category" });
  }

  // Nookipedia API endpoint 매핑
  const endpointMap: Record<string, string> = {
    fish: "https://api.nookipedia.com/nh/fish",
    bug: "https://api.nookipedia.com/nh/bugs",
    sea: "https://api.nookipedia.com/nh/sea",
    fossil: "https://api.nookipedia.com/nh/fossils/all",
  };

  const endpoint = endpointMap[category];

  try {
    const res = await fetch(endpoint, {
      headers: {
        "X-API-KEY": process.env.NOOKIPEDIA_API_KEY!,
        "Accept-Version": "1.0.0",
      },
      cache: "no-store",
    });

    if (!res.ok) throw new Error(`Fetch failed: ${endpoint}`);

    const rawData = await res.json();

    let normalized: any[] = [];

    // 화석: 구조가 다르기 때문에 별도 처리
    if (category === "fossil") {
      for (const dino of rawData) {
        for (const fossil of dino.fossils) {
          normalized.push({
            originalName: fossil.name, // 영어 원본 이름
            name: nameKoMap[fossil.name] || fossil.name, // 한글 변환
            image_url: fossil.image_url,
            sell_nook: fossil.sell,
            location: locationKoMap["Museum"] || "박물관",
            months: "All year",
          });
        }
      }
    } else {
      // 물고기, 곤충, 해양생물
      normalized = rawData.map((item: any) => ({
        originalName: item.name, // 영어 원본 이름 (key용)
        name: nameKoMap[item.name] || item.name, // 한글 이름
        image_url: item.image_url,
        sell_nook: item.sell_nook,
        location: locationKoMap[item.location] || item.location || "알 수 없음",
        months_array:
          item.north?.months_array || item.south?.months_array || [],
      }));
    }

    return NextResponse.json({ ok: true, data: normalized });
  } catch (err) {
    console.error("Nookipedia fetch error:", err);
    return NextResponse.json({ ok: false, error: "Server error" });
  }
}
