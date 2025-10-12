import { NextResponse } from "next/server";

const VALID_CATEGORIES = ["fish", "bug", "sea", "fossil"];

export async function GET(
  req: Request,
  context: { params: Promise<{ category: string }> }
) {
  // ✅ params를 먼저 await
  const { category } = await context.params;

  if (!VALID_CATEGORIES.includes(category)) {
    return NextResponse.json({ ok: false, error: "Invalid category" });
  }

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

    if (category === "fossil") {
      for (const dino of rawData) {
        for (const fossil of dino.fossils) {
          normalized.push({
            name: fossil.name,
            image_url: fossil.image_url,
            sell_nook: fossil.sell,
            location: "Museum",
            months: "All year",
          });
        }
      }
    } else {
      normalized = rawData.map((item: any) => ({
        name: item.name,
        image_url: item.image_url,
        sell_nook: item.sell_nook,
        location:
          category === "sea"
            ? "Sea"
            : item.location || "Unknown",
        months_array:
          item.north?.months_array || item.south?.months_array || [],
      }));
    }

    return NextResponse.json({ ok: true, data: normalized });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: false, error: "Server error" });
  }
}
