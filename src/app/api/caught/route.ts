import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { caughtItems, categoryEnum } from "@/db/schema";

export const runtime = "nodejs";

type Category = typeof categoryEnum.enumValues[number];
function isCategory(v: unknown): v is Category {
  return typeof v === "string" && (categoryEnum.enumValues as readonly string[]).includes(v);
}

// GET /api/caught?userId=123&category=fish
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userIdStr = searchParams.get("userId");
    const categoryStr = searchParams.get("category");

    const userId = Number(userIdStr);
    if (!userIdStr || Number.isNaN(userId)) {
      return NextResponse.json({ ok: false, error: "Invalid userId" }, { status: 400 });
    }
    if (!isCategory(categoryStr)) {
      return NextResponse.json({ ok: false, error: "Invalid category" }, { status: 400 });
    }
    const category: Category = categoryStr;

    const rows = await db
      .select({ itemName: caughtItems.itemName })
      .from(caughtItems)
      .where(and(
        eq(caughtItems.userId, userId),
        eq(caughtItems.category, category)
      ));

    return NextResponse.json({ ok: true, items: rows.map(r => r.itemName) });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}
